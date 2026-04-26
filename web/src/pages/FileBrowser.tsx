import { fileContentUrl, listFiles } from "@/api";
import type { FileEntry } from "@/types";
import { useEffect, useState } from "react";
import {
  Folder,
  File,
  Image,
  Film,
  Music,
  FileText,
  ChevronLeft,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Download,
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function isImage(name: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name);
}
function isVideo(name: string) {
  return /\.(mp4|webm|ogg|mov|mkv)$/i.test(name);
}
function isAudio(name: string) {
  return /\.(mp3|wav|ogg|flac|m4a)$/i.test(name);
}
function isText(name: string) {
  return /\.(txt|md|json|js|jsx|ts|tsx|html|css|scss|less|py|java|rb|go|rs|xml|yaml|yml|csv|log|ini|conf)$/i.test(
    name,
  );
}

function isCompressed(name: string) {
  return /\.(zip|rar|7z|tar|gz|bz2|xz|zst|lz|lzma|arj|cab|iso)$/i.test(name);
}

function parentPath(path: string) {
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return "/" + parts.join("/");
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function fileIcon(entry: FileEntry) {
  if (entry.is_dir) return <Folder className="w-10 h-10 text-sky-500" />;
  const name = entry.name.toLowerCase();
  if (isImage(name)) return <Image className="w-10 h-10 text-emerald-500" />;
  if (isVideo(name)) return <Film className="w-10 h-10 text-violet-500" />;
  if (isAudio(name)) return <Music className="w-10 h-10 text-amber-500" />;
  if (isText(name)) return <FileText className="w-10 h-10 text-blue-500" />;
  if (isCompressed(name))
    return <FileArchive className="w-10 h-10 text-orange-500" />;
  return <File className="w-10 h-10 text-gray-400" />;
}

function breadcrumbs(path: string) {
  const parts = path.split("/").filter(Boolean);
  const crumbs = parts.map((part, idx) => ({
    label: part,
    path: "/" + parts.slice(0, idx + 1).join("/"),
    last: idx === parts.length - 1,
  }));

  if (crumbs.length === 0)
    return [{ label: "My Drive", path: "/", last: true }];
  return [{ label: "My Drive", path: "/", last: false }, ...crumbs];
}

// ---------- component ----------
export default function FileBrowser() {
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // text file preview
  const [textContent, setTextContent] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setSelectedFile(null);

    listFiles(currentPath)
      .then((data) => setEntries(data.entries))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentPath]);

  function openEntry(entry: FileEntry) {
    if (entry.is_dir) {
      setCurrentPath(entry.path);
      return;
    }

    // file selected → open dialog
    setSelectedFile(entry);
    setDialogOpen(true);

    // reset text preview
    setTextContent("");
    setTextError("");
    setLoadingText(false);

    // if text file, fetch content
    if (isText(entry.name)) {
      setLoadingText(true);
      fetch(fileContentUrl(entry.path))
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load text");
          return res.text();
        })
        .then((text) => setTextContent(text))
        .catch((err) => setTextError(err.message))
        .finally(() => setLoadingText(false));
    }
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setSelectedFile(null);
  }

  const crumbs = breadcrumbs(currentPath);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 font-sans space-y-6">
      {/* ---- top bar ---- */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {currentPath !== "/" && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPath(parentPath(currentPath))}
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {/* breadcrumbs */}
          <nav
            className="flex items-center gap-1.5 text-sm"
            aria-label="Breadcrumb"
          >
            {crumbs.map((crumb, idx) => (
              <span key={crumb.path} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-muted-foreground">/</span>}
                {crumb.last ? (
                  <span className="font-semibold truncate max-w-50">
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentPath(crumb.path)}
                    className="text-muted-foreground hover:text-foreground transition truncate max-w-50"
                  >
                    {crumb.label}
                  </button>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* ---- error ---- */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ---- loading skeleton ---- */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {/* ---- file & folder grid ---- */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {entries.map((entry) => (
            <button
              key={entry.path}
              onClick={() => openEntry(entry)}
              className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                ${selectedFile?.path === entry.path && dialogOpen
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50 shadow-sm"
                }
                focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              {/* file icon */}
              <div className="p-2 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                {fileIcon(entry)}
              </div>

              {/* name */}
              <span className="text-sm font-medium text-center w-full truncate">
                {entry.name}
              </span>

              {/* size (only for files) */}
              {!entry.is_dir && (
                <span className="text-xs text-muted-foreground">
                  {formatSize(entry.size)}
                </span>
              )}

              {/* subtle more-options placeholder */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ---- File Preview Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl min-w-3xl overflow-y-auto p-0">
          {selectedFile && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-xl font-semibold flex items-start gap-3 wrap-break-words">
                  {fileIcon(selectedFile)}
                  <span className="whitespace-normal wrap-break-words">
                    {selectedFile.name}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 pt-4 space-y-4">
                {isImage(selectedFile.name) && (
                  <div className="rounded-xl overflow-hidden border bg-muted/30">
                    <img
                      src={fileContentUrl(selectedFile.path)}
                      alt={selectedFile.name}
                      className="max-w-full max-h-[70vh] object-contain mx-auto"
                    />
                  </div>
                )}

                {isVideo(selectedFile.name) && (
                  <video
                    src={fileContentUrl(selectedFile.path)}
                    controls
                    className="w-full max-h-[70vh] rounded-xl"
                  />
                )}

                {isAudio(selectedFile.name) && (
                  <audio
                    src={fileContentUrl(selectedFile.path)}
                    controls
                    className="w-full mt-2"
                  />
                )}

                {isText(selectedFile.name) && (
                  <div className="border rounded-xl bg-muted/30 p-4 max-h-[60vh] overflow-auto">
                    {loadingText && (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {textError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{textError}</AlertDescription>
                      </Alert>
                    )}
                    {!loadingText && !textError && textContent !== null && (
                      <pre className="text-sm font-mono whitespace-pre-wrap wrap-break-words">
                        {textContent}
                      </pre>
                    )}
                  </div>
                )}

                {/* fallback: any other file type */}
                {!isImage(selectedFile.name) &&
                  !isVideo(selectedFile.name) &&
                  !isAudio(selectedFile.name) &&
                  !isText(selectedFile.name) && (
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                      <File className="w-16 h-16 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No preview available
                      </p>
                      <Button asChild>
                        <a
                          href={fileContentUrl(selectedFile.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download file
                        </a>
                      </Button>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
