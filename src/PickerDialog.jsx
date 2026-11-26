import React, { useEffect, useId, useRef } from "react";

export default function PickerDialog({ open, onClose, title, description, className = "", children }) {
  const dialog = useRef(null);
  const exitAnimation = useRef(null);
  const closing = useRef(false);
  const backdropPress = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    closing.current = false;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.querySelector("[data-initial-focus]")?.focus();
    return () => {
      exitAnimation.current?.cancel();
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  function close() {
    const element = dialog.current;
    if (!element?.open || closing.current) return;
    closing.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !element.animate) {
      onClose();
      return;
    }
    exitAnimation.current = element.animate([
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 0, transform: "translateY(12px) scale(.98)" }
    ], { duration: 160, easing: "ease-in", fill: "forwards" });
    exitAnimation.current.finished.then(() => {
      if (element.isConnected && element.open) onClose();
    }, () => {});
  }

  function outside(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  }

  function keepFocus(event) {
    if (event.key !== "Tab") return;
    const element = dialog.current;
    const controls = [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]')];
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return <dialog ref={dialog} className={"picker-dialog " + className}
    aria-labelledby={titleId} aria-describedby={descriptionId}
    onKeyDown={keepFocus}
    onCancel={event => { event.preventDefault(); close(); }}
    onPointerDown={event => { backdropPress.current = event.target === event.currentTarget && outside(event); }}
    onClick={event => {
      if (backdropPress.current && event.target === event.currentTarget && outside(event)) close();
    }}>
    {open && <>
      <div className="picker-header">
        <div><h2 className="picker-title" id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div>
        <button className="picker-close" type="button" aria-label="Tutup popup" onClick={close}>×</button>
      </div>
      {children(close)}
    </>}
  </dialog>;
}
