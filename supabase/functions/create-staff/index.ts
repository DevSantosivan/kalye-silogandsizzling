import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// =========================================================
// HELPER RESPONSE
// =========================================================

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// =========================================================
// EDGE FUNCTION
// =========================================================

Deno.serve(async (req: Request) => {
  // =======================================================
  // CORS PREFLIGHT
  // =======================================================

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  // =======================================================
  // ONLY POST
  // =======================================================

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Method not allowed.',
      },
      405,
    );
  }

  try {
    // =====================================================
    // ENVIRONMENT
    // =====================================================

    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    const serviceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl) {
      throw new Error(
        'SUPABASE_URL is missing.',
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is missing.',
      );
    }

    // =====================================================
    // SUPABASE ADMIN CLIENT
    // =====================================================

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // =====================================================
    // REQUEST BODY
    // =====================================================

    let body: {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
      status?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      throw new Error(
        'Invalid JSON request body.',
      );
    }

    // =====================================================
    // FORM DATA
    // =====================================================

    const name = String(
      body.name ?? '',
    ).trim();

    const email = String(
      body.email ?? '',
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password ?? '',
    );

    const role = String(
      body.role ?? 'Cashier',
    );

    const status = String(
      body.status ?? 'Active',
    );

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!name) {
      throw new Error(
        'Name is required.',
      );
    }

    if (!email) {
      throw new Error(
        'Email is required.',
      );
    }

    if (!password) {
      throw new Error(
        'Password is required.',
      );
    }

    if (password.length < 6) {
      throw new Error(
        'Password must be at least 6 characters.',
      );
    }

    const allowedRoles = [
      'Cashier',
      'Kitchen Staff',
      'User',
    ];

    if (!allowedRoles.includes(role)) {
      throw new Error(
        'Invalid staff role.',
      );
    }

    const allowedStatuses = [
      'Active',
      'Inactive',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error(
        'Invalid user status.',
      );
    }

    // =====================================================
    // CHECK EXISTING PUBLIC USER
    // =====================================================

    const {
      data: existingUser,
      error: existingUserError,
    } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUserError) {
      console.error(
        'Check existing user error:',
        existingUserError,
      );

      throw existingUserError;
    }

    if (existingUser) {
      throw new Error(
        'A user with this email already exists.',
      );
    }

    // =====================================================
    // CREATE SUPABASE AUTH USER
    // =====================================================

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error(
        'Create Auth user error:',
        authError,
      );

      throw authError;
    }

    if (!authData.user) {
      throw new Error(
        'Auth user was not created.',
      );
    }

    const authUserId =
      authData.user.id;

    // =====================================================
    // CREATE PUBLIC.USERS RECORD
    // =====================================================

    const {
      data: userData,
      error: userError,
    } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        name,
        email,
        role,
        status,
      })
      .select(
        'id, name, email, role, status, created_at',
      )
      .single();

    // =====================================================
    // ROLLBACK AUTH USER
    // =====================================================

    if (userError) {
      console.error(
        'Create public.users error:',
        userError,
      );

      try {
        await supabaseAdmin.auth.admin.deleteUser(
          authUserId,
        );
      } catch (rollbackError) {
        console.error(
          'Rollback Auth user failed:',
          rollbackError,
        );
      }

      throw userError;
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return jsonResponse({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error(
      'Create staff function error:',
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to create staff account.';

    return jsonResponse(
      {
        success: false,
        error: message,
      },
      400,
    );
  }
});