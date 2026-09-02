import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
})
export class RichTextEditorComponent implements AfterViewInit {
  @ViewChild('editor')
  editor!: ElementRef<HTMLDivElement>;

  // ==========================================
  // VALUE
  // ==========================================

  private _value = '';

  @Input()
  set value(value: string) {
    this._value = value || '';

    if (this.editor) {
      this.setEditorValue();
    }
  }

  get value(): string {
    return this._value;
  }

  @Output()
  valueChange = new EventEmitter<string>();

  // ==========================================
  // CONFIG
  // ==========================================

  @Input()
  placeholder = 'Write something...';

  @Input()
  disabled = false;

  // ==========================================
  // INITIALIZE
  // ==========================================

  ngAfterViewInit(): void {
    this.setEditorValue();
  }

  // ==========================================
  // SET HTML VALUE
  // ==========================================

  private setEditorValue(): void {
    if (!this.editor) {
      return;
    }

    const element = this.editor.nativeElement;

    // Prevent unnecessary DOM updates
    // while user is typing.
    if (element.innerHTML !== this._value) {
      element.innerHTML = this._value;
    }
  }

  // ==========================================
  // FORMAT
  // ==========================================

  format(command: string, value?: string): void {
    if (this.disabled) {
      return;
    }

    this.editor.nativeElement.focus();

    document.execCommand(command, false, value);

    this.updateValue();
  }

  // ==========================================
  // UPDATE VALUE
  // ==========================================

  updateValue(): void {
    if (!this.editor) {
      return;
    }

    this._value = this.editor.nativeElement.innerHTML;

    this.valueChange.emit(this._value);
  }

  // ==========================================
  // CLEAR FORMATTING
  // ==========================================

  clearFormatting(): void {
    this.format('removeFormat');
  }

  // ==========================================
  // HANDLE PASTE
  // ==========================================
  onPaste(event: ClipboardEvent): void {
    if (this.disabled) {
      return;
    }

    event.preventDefault();

    const text = event.clipboardData?.getData('text/plain') || '';

    document.execCommand('insertText', false, text);

    this.updateValue();
  }
}
