;;; flatppl-ts-mode.el --- Tree-sitter major mode for FlatPPL -*- lexical-binding: t; -*-

;; SKELETON — not yet verified in Emacs. Uses Emacs 29+ built-in tree-sitter
;; (`treesit'). Highlighting covers structural nodes; distribution/builtin
;; keyword colouring is left as a TODO (those live in keyword-lists.json and
;; would duplicate the word lists here — pull them from there to avoid drift).

;;; Code:
(require 'treesit)

;; Install the grammar from the tree-sitter target in flatppl-grammars.
;; Pin a revision in place of "main" for reproducibility, then run
;; M-x treesit-install-language-grammar RET flatppl RET
(add-to-list
 'treesit-language-source-alist
 '(flatppl "https://github.com/flatppl/flatppl-grammars" "main" "tree-sitter/src"))

(defvar flatppl-ts-mode--font-lock-settings
  (treesit-font-lock-rules
   :language 'flatppl
   :feature 'comment
   '((line_comment) @font-lock-comment-face
     (doc_line) @font-lock-doc-face)

   :language 'flatppl
   :feature 'string
   '((string) @font-lock-string-face
     (escape_sequence) @font-lock-escape-face
     (invalid_escape) @font-lock-warning-face)

   :language 'flatppl
   :feature 'number
   '((integer) @font-lock-number-face
     (float) @font-lock-number-face)

   :language 'flatppl
   :feature 'constant
   '((boolean) @font-lock-constant-face)

   :language 'flatppl
   :feature 'property
   '((axis_name) @font-lock-property-name-face
     (variance_marker) @font-lock-property-name-face)

   :language 'flatppl
   :feature 'function
   '((call_expression (identifier) @font-lock-function-call-face)))
  "Tree-sitter font-lock settings for `flatppl-ts-mode'.
TODO: add a `keyword'/`type' feature matching distribution and builtin
identifiers from flatppl-grammars/keyword-lists.json.")

;;;###autoload
(define-derived-mode flatppl-ts-mode prog-mode "FlatPPL"
  "Major mode for FlatPPL, powered by tree-sitter."
  (when (treesit-ready-p 'flatppl)
    (treesit-parser-create 'flatppl)
    (setq-local treesit-font-lock-settings flatppl-ts-mode--font-lock-settings)
    (setq-local treesit-font-lock-feature-list
                '((comment string)
                  (number constant property)
                  (function)
                  ()))
    (setq-local comment-start "# ")
    (setq-local comment-end "")
    (treesit-major-mode-setup)))

;;;###autoload
(add-to-list 'auto-mode-alist '("\\.flatppl\\'" . flatppl-ts-mode))

(provide 'flatppl-ts-mode)
;;; flatppl-ts-mode.el ends here
