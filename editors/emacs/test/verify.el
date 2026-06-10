;;; Headless verification of flatppl-ts-mode -*- lexical-binding: t; -*-
;; Driven by verify.sh, which compiles the grammar lib and points
;; FLATPPL_TS_LOAD_PATH at it. Asserts the grammar loads, parses, the font-lock
;; queries compile (invalid node names would error here), and faces apply.

(setq treesit-extra-load-path (list (getenv "FLATPPL_TS_LOAD_PATH")))
(require 'treesit)
(require 'flatppl-ts-mode)
(setq treesit-font-lock-level 4)

(let ((fail 0))
  (cl-flet ((ok (cond msg)
              (princ (format "%s: %s\n" (if cond "ok " "FAIL") msg))
              (unless cond (setq fail (1+ fail))))
            (has-face (pos target)
              (let ((f (get-text-property pos 'face)))
                (if (listp f) (memq target f) (eq f target)))))

    (ok (treesit-ready-p 'flatppl) "flatppl grammar lib loads (treesit-ready-p)")

    (with-temp-buffer
      (insert "alpha ~ Normal(0, 1)\n# a comment\n")
      ;; flatppl-ts-mode -> treesit-major-mode-setup COMPILES the font-lock
      ;; queries; an invalid node name would signal here and fail the batch.
      (flatppl-ts-mode)
      (font-lock-ensure)

      (let ((root (treesit-buffer-root-node)))
        (ok (and root (treesit-node-p root))
            (format "parser root node: %s" (treesit-node-type root))))

      (goto-char (point-min)) (search-forward "Normal")
      (ok (has-face (match-beginning 0) 'font-lock-function-call-face)
          "Normal -> font-lock-function-call-face (call head)")
      (goto-char (point-min)) (search-forward "0")
      (ok (has-face (match-beginning 0) 'font-lock-number-face)
          "0 -> font-lock-number-face")
      (goto-char (point-min)) (search-forward "# a comment")
      (ok (has-face (match-beginning 0) 'font-lock-comment-face)
          "# a comment -> font-lock-comment-face")))

  (if (> fail 0)
      (progn (princ (format "\n%d emacs check(s) failed\n" fail)) (kill-emacs 1))
    (princ "\nOK: emacs flatppl-ts-mode loads, parses, and font-locks\n")))
