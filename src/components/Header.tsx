import { useState, useRef, useEffect } from 'react';
import { useDocuments, SAMPLE_FLOWS } from '../store';
import type { SampleFlowKey } from '../store';
import type { SaveStatus } from '../types';

function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === 'saving' && (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-slate-400">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-500">Saved</span>
        </>
      )}
      {status === 'unsaved' && (
        <>
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-slate-500">Editing...</span>
        </>
      )}
    </div>
  );
}

function DocumentTitle({ 
  name, 
  onRename 
}: { 
  name: string; 
  onRename: (name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setEditValue(name);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') {
            setEditValue(name);
            setIsEditing(false);
          }
        }}
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 outline-none focus:border-blue-500 min-w-48"
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition-colors"
      title="Click to rename"
    >
      {name}
    </button>
  );
}

function DocumentDropdown({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { 
    documents, 
    activeDocumentId, 
    switchDocument, 
    createDocument, 
    createSampleDocument,
    deleteDocument,
    duplicateDocument 
  } = useDocuments();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedDocs = [...documents].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 max-h-96 overflow-auto"
    >
      <div className="px-3 py-2 border-b border-slate-700">
        <button
          onClick={() => {
            createDocument();
            onClose();
          }}
          className="w-full text-left text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 py-1"
        >
          <span className="text-lg leading-none">+</span>
          New Flow
        </button>
      </div>
      
      <div className="px-3 py-2 border-b border-slate-700">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sample Flows</div>
        {(Object.entries(SAMPLE_FLOWS) as [SampleFlowKey, { name: string; description: string }][]).map(([key, flow]) => (
          <button
            key={key}
            onClick={() => {
              createSampleDocument(key);
              onClose();
            }}
            className="w-full text-left text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2 py-1.5 hover:bg-slate-700/50 rounded px-1 -mx-1"
          >
            <span className="text-lg leading-none">✦</span>
            <div>
              <div>{flow.name}</div>
              <div className="text-xs text-slate-500">{flow.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="py-1">
        {sortedDocs.map((doc) => (
          <div
            key={doc.id}
            className={`group flex items-center justify-between px-3 py-2 hover:bg-slate-700 cursor-pointer ${
              doc.id === activeDocumentId ? 'bg-slate-700/50' : ''
            }`}
            onClick={() => {
              switchDocument(doc.id);
              onClose();
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-200 truncate">{doc.name}</div>
              <div className="text-xs text-slate-500">
                {new Date(doc.updatedAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateDocument(doc.id);
                  onClose();
                }}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded"
                title="Duplicate"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {documents.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDocument(doc.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const { activeDocument, saveStatus, renameDocument } = useDocuments();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.logic')) {
      setError('Invalid file type. Please select a .logic file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log('Importing file:', file.name);
      console.log('Content:', text);
      // Stub: handleImport(text, file.name);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleExport = () => {
    console.log('Exporting document...');
    // Stub: handleExport();
    const blob = new Blob(['(stub) document content'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDocument.name}.logic`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4">
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
            title="Switch document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <DocumentDropdown isOpen={dropdownOpen} onClose={() => setDropdownOpen(false)} />

          <DocumentTitle 
            name={activeDocument.name} 
            onRename={(name) => renameDocument(activeDocument.id, name)} 
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".logic"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            title="Import .logic file"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            title="Export to .logic file"
          >
            Export
          </button>
        </div>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <SaveIndicator status={saveStatus} />
      </header>
      {error && (
        <div className="bg-slate-800 border-b border-slate-700 text-red-400 px-4 py-2 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="text-slate-500 hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
