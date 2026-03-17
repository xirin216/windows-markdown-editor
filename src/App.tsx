import { useEffect, useRef, useState } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import "./styles.css";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join, dirname } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  readTextFile,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

const APP_NAME = "markdown-editor";
const DEFAULT_DOCUMENT = `# New Document

Start writing in Markdown.
`;
const MARKDOWN_FILTERS = [
  { name: "Markdown files", extensions: ["md"] },
  { name: "All files", extensions: ["*"] },
];
const WIDTH_OPTIONS = [
  { id: "standard", label: "기본" },
  { id: "wide", label: "넓게" },
  { id: "full", label: "전체" },
] as const;

type EditorWidth = (typeof WIDTH_OPTIONS)[number]["id"];

function getDisplayName(filePath: string | null) {
  if (!filePath) {
    return "untitled.md";
  }

  const normalizedPath = filePath.replace(/\\/g, "/");
  return normalizedPath.split("/").pop() || normalizedPath;
}

function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const vditorRef = useRef<Vditor | null>(null);
  const currentFilePathRef = useRef<string | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorWidth, setEditorWidth] = useState<EditorWidth>("standard");

  const setActiveFilePath = (filePath: string | null) => {
    currentFilePathRef.current = filePath;
    setCurrentFilePath(filePath);
  };

  const saveDocument = async (forcePrompt = false) => {
    const editor = vditorRef.current;
    if (!editor) {
      return;
    }

    let targetPath = forcePrompt ? null : currentFilePathRef.current;
    if (!targetPath) {
      const selectedPath = await save({
        defaultPath: currentFilePathRef.current ?? "untitled.md",
        filters: MARKDOWN_FILTERS,
      });

      if (!selectedPath) {
        return;
      }

      targetPath = selectedPath;
    }

    try {
      await writeTextFile(targetPath, editor.getValue());
      setActiveFilePath(targetPath);
    } catch (error) {
      console.error("Failed to save document:", error);
    }
  };

  const saveDocumentAs = async () => {
    await saveDocument(true);
  };

  const openDocumentAtPath = async (filePath: string) => {
    const editor = vditorRef.current;
    if (!editor) {
      return;
    }

    try {
      const fileContent = await readTextFile(filePath);
      editor.setValue(fileContent);
      setActiveFilePath(filePath);
    } catch (error) {
      console.error("Failed to open document:", error);
    }
  };

  const openDocument = async () => {
    if (!vditorRef.current) {
      return;
    }

    const selectedPath = await open({
      directory: false,
      multiple: false,
      filters: MARKDOWN_FILTERS,
    });

    if (!selectedPath || Array.isArray(selectedPath)) {
      return;
    }

    await openDocumentAtPath(selectedPath);
  };

  const printDocument = () => {
    window.print();
  };

  useEffect(() => {
    const windowTitle = `${getDisplayName(currentFilePath)} - ${APP_NAME}`;
    document.title = windowTitle;
    void getCurrentWindow().setTitle(windowTitle);
  }, [currentFilePath]);

  useEffect(() => {
    if (!editorRef.current || vditorRef.current) {
      return;
    }

    let isDisposed = false;
    const vditorInstance = new Vditor(editorRef.current, {
      height: "100%",
      mode: "wysiwyg",
      theme: "classic",
      icon: "material",
      lang: "ko_KR",
      cdn: "/vditor",
      outline: {
        enable: false,
        position: "right",
      },
      toolbarConfig: {
        pin: true,
        hide: false,
      },
      toolbar: [
        "emoji", "headings", "bold", "italic", "strike", "link", "|",
        "list", "ordered-list", "check", "outdent", "indent", "|",
        "quote", "line", "code", "inline-code", "insert-before", "insert-after", "|",
        "upload", "record", "table", "|",
        "undo", "redo", "|",
        "edit-mode", "content-theme", "export", "|",
        "info", "help",
      ],
      preview: {
        theme: {
          current: "light",
        },
        markdown: {
          toc: true,
        },
      },
      hint: {
        parse: true,
        delay: 0,
      },
      cache: {
        enable: false,
      },
      upload: {
        accept: "image/*",
        multiple: true,
        handler: async (files: File[]) => {
          if (!currentFilePathRef.current) {
            alert("Save the document before adding images.");
            return null;
          }

          const baseDir = await dirname(currentFilePathRef.current);
          const assetsDir = await join(baseDir, "assets");

          try {
            if (!(await exists(assetsDir))) {
              await mkdir(assetsDir);
            }
          } catch (error) {
            console.error("Failed to create assets directory:", error);
          }

          for (const file of files) {
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = await join(assetsDir, fileName);
            const arrayBuffer = await file.arrayBuffer();
            await writeFile(filePath, new Uint8Array(arrayBuffer));

            const relativePath = `assets/${fileName}`;
            vditorInstance.insertValue(`![${file.name}](${relativePath})`);
          }

          return null;
        },
      },
      input: async () => {
        if (!currentFilePathRef.current) {
          return;
        }

        const baseDir = await dirname(currentFilePathRef.current);
        const previewElement =
          document.querySelector(".vditor-preview__content") ||
          document.querySelector(".vditor-wysiwyg");

        if (!previewElement) {
          return;
        }

        const images = previewElement.querySelectorAll("img");
        for (const image of images) {
          const source = image.getAttribute("src");
          if (
            source &&
            !source.startsWith("http") &&
            !source.startsWith("data:") &&
            !source.startsWith("asset:")
          ) {
            const fullPath = await join(baseDir, source);
            image.setAttribute("src", convertFileSrc(fullPath));
          }
        }
      },
      after: async () => {
        if (isDisposed) {
          return;
        }

        vditorRef.current = vditorInstance;
        setIsEditorReady(true);

        try {
          const args = await invoke<string[]>("get_cli_args");
          if (args.length > 1 && args[1].endsWith(".md")) {
            await openDocumentAtPath(args[1]);
            return;
          }
        } catch (error) {
          console.error("Failed to process CLI arguments:", error);
        }

        vditorInstance.setValue(DEFAULT_DOCUMENT);
      },
    });

    return () => {
      isDisposed = true;
      setIsEditorReady(false);
      vditorRef.current = null;
      vditorInstance.destroy();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "s" && event.shiftKey) {
        event.preventDefault();
        void saveDocumentAs();
        return;
      }

      if (key === "s") {
        event.preventDefault();
        void saveDocument();
      } else if (key === "o") {
        event.preventDefault();
        void openDocument();
      } else if (key === "p") {
        event.preventDefault();
        printDocument();
      }
    };

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items || !vditorRef.current || !currentFilePathRef.current) {
        return;
      }

      for (const item of Array.from(items)) {
        if (!item.type.includes("image")) {
          continue;
        }

        const file = item.getAsFile();
        if (!file) {
          continue;
        }

        try {
          const baseDir = await dirname(currentFilePathRef.current);
          const assetsDir = await join(baseDir, "assets");

          if (!(await exists(assetsDir))) {
            await mkdir(assetsDir);
          }

          const fileName = `pasted-${Date.now()}.png`;
          const filePath = await join(assetsDir, fileName);
          const arrayBuffer = await file.arrayBuffer();

          await writeFile(filePath, new Uint8Array(arrayBuffer));
          vditorRef.current.insertValue(`![image](assets/${fileName})`);
        } catch (error) {
          console.error("Failed to save pasted image:", error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);

    const unlistenDrop = getCurrentWindow().listen("tauri://drag-drop", async (event: any) => {
      const paths = event.payload.paths as string[] | undefined;
      if (!paths?.length || !vditorRef.current) {
        return;
      }

      const dropPath = paths[0];
      if (dropPath.endsWith(".md")) {
        await openDocumentAtPath(dropPath);
        return;
      }

      if (!dropPath.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
        return;
      }

      if (!currentFilePathRef.current) {
        alert("Save the document before adding images.");
        return;
      }

      try {
        const fileName = dropPath.split(/[\\/]/).pop() || "image";
        const baseDir = await dirname(currentFilePathRef.current);
        const assetsDir = await join(baseDir, "assets");

        if (!(await exists(assetsDir))) {
          await mkdir(assetsDir);
        }

        const targetFileName = `${Date.now()}-${fileName}`;
        const targetPath = await join(assetsDir, targetFileName);
        const fileData = await invoke<number[]>("read_file_binary", { path: dropPath });

        await writeFile(targetPath, new Uint8Array(fileData));
        vditorRef.current.insertValue(
          `![${fileName}](assets/${targetFileName.replace(/\\/g, "/")})`,
        );
      } catch (error) {
        console.error("Failed to copy dropped image:", error);
      }
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
      void unlistenDrop.then((unlisten) => unlisten());
    };
  }, []);

  const fileLabel = currentFilePath
    ? currentFilePath.replace(/\\/g, "/")
    : "No file selected";

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-brand">
          <strong className="app-title">{APP_NAME}</strong>
          <span className="app-subtitle">{fileLabel}</span>
        </div>
        <div className="app-controls">
          <div className="view-options" aria-label="Editor width">
            {WIDTH_OPTIONS.map((option) => (
              <button
                aria-pressed={editorWidth === option.id}
                className={editorWidth === option.id ? "is-active" : undefined}
                onClick={() => setEditorWidth(option.id)}
                type="button"
                key={option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="app-actions">
          <button disabled={!isEditorReady} onClick={() => void openDocument()} type="button">
            열기
          </button>
          <button disabled={!isEditorReady} onClick={() => void saveDocument()} type="button">
            저장
          </button>
          <button disabled={!isEditorReady} onClick={() => void saveDocumentAs()} type="button">
            다른 이름으로 저장
          </button>
          <button disabled={!isEditorReady} onClick={printDocument} type="button">
            출력
          </button>
          </div>
        </div>
      </header>
      <div className="editor-shell" data-width={editorWidth}>
        <div id="vditor" className="vditor-wrapper" ref={editorRef} />
      </div>
      <footer className="app-statusbar">
        <span>{getDisplayName(currentFilePath)}</span>
        <span>폭 {WIDTH_OPTIONS.find((option) => option.id === editorWidth)?.label}</span>
        <span>Ctrl+S Save</span>
        <span>Ctrl+Shift+S Save As</span>
        <span>Ctrl+O Open</span>
        <span>Ctrl+P Print</span>
      </footer>
    </div>
  );
}

export default App;
