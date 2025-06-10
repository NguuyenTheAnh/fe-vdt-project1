import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-modal-container',
    template: `
    <div *ngIf="isOpen" class="modal-portal-overlay" (click)="onOverlayClick()">
      <div class="modal-portal-content" (click)="$event.stopPropagation()">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    styles: [`
    .modal-portal-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 9999 !important;
      /* Ensure modal is rendered in a new stacking context */
      transform: translateZ(0) !important;
      will-change: transform !important;
    }    .modal-portal-content {
      transform: translateZ(0) !important;
      will-change: transform !important;
      max-width: calc(100vw - 2rem);
      /* Remove height constraints and overflow - let inner content handle it */
      overflow: visible;    }

    /* Ensure this component is not affected by parent transforms */
    :host {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 9999 !important;
    }

    :host .modal-portal-overlay {
      pointer-events: all !important;
    }
  `]
})
export class ModalContainerComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    onOverlayClick() {
        this.close.emit();
    }
}
