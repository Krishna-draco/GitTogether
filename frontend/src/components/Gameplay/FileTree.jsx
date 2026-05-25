import React, { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import "../../styles/filetree.css";

const FILE_STRUCTURE = [
  {
    name: "server.js",
    type: "file",
    content: "Main server entry point",
  },
  {
    name: "package.json",
    type: "file",
    content: "Project dependencies",
  },
  {
    name: ".env.example",
    type: "file",
    content: "Environment variables template",
  },
  {
    name: "node_modules",
    type: "folder",
    children: [],
  },
  {
    name: "config",
    type: "folder",
    children: [
      { name: "database.js", type: "file" },
      { name: "server.js", type: "file" },
    ],
  },
];

const FileItem = ({ item, level = 0, onSelectFile }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  if (item.type === "file") {
    return (
      <div className="file-item" style={{ paddingLeft: `${level * 16}px` }}>
        <button className="file-button" onClick={() => onSelectFile?.(item)}>
          <File size={16} />
          <span className="file-name">{item.name}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="folder-item" style={{ paddingLeft: `${level * 16}px` }}>
        <button className="folder-toggle" onClick={handleToggle}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Folder size={16} />
          <span className="folder-name">{item.name}</span>
        </button>
      </div>
      {expanded &&
        item.children?.map((child, idx) => (
          <FileItem
            key={idx}
            item={child}
            level={level + 1}
            onSelectFile={onSelectFile}
          />
        ))}
    </>
  );
};

export const FileTree = ({ onSelectFile }) => {
  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <h3>Project Files</h3>
      </div>
      <div className="file-tree-content">
        {FILE_STRUCTURE.map((item, idx) => (
          <FileItem key={idx} item={item} onSelectFile={onSelectFile} />
        ))}
      </div>
    </div>
  );
};
