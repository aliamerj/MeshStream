export type FileEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
};

export type FileListResponse = {
  path: string;
  entries: FileEntry[];
};
