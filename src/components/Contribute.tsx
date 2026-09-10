import { useEffect, useRef, useState } from "react";
export function Contribute({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="contribute-dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      <button
        className="close-button"
        aria-label="Close contribution guide"
        onClick={close}
      >
        ×
      </button>
      <h2>YOUR TURN.</h2>
      <p>Three apps is a start. What would you make with a hinge?</p>
      <p>
        Read <code>docs/native-api.md</code>, copy the example app, and add it
        to the registry. Hardware input, simulation and fullscreen are already
        there.
      </p>
      <code className="repo-name">github.com/magiccube/hyper-hinge</code>
      <button
        className="pill primary"
        onClick={() => {
          void navigator.clipboard
            .writeText("https://github.com/magiccube/hyper-hinge")
            .then(() => setCopied(true))
            .catch(() => setError("Select and copy the address above."));
        }}
      >
        {copied ? "Copied" : "Copy repository link"}
      </button>
      {error && <p role="status">{error}</p>}
    </dialog>
  );
}
