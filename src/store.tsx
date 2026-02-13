import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { OutlineNode, NodeType, Document, SaveStatus } from './types';

const STORAGE_KEY = 'logic-flow-documents';
const ACTIVE_DOC_KEY = 'logic-flow-active-doc';
const SAVE_DELAY = 1000;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyNodes(): OutlineNode[] {
  return [
    { id: generateId(), type: 'start', label: 'Start', children: [] },
  ];
}

export type SampleFlowKey = 'k8s-auth' | 'ci-cd-pipeline' | 'incident-response';

export const SAMPLE_FLOWS: Record<SampleFlowKey, { name: string; description: string }> = {
  'k8s-auth': { name: 'K8s Auth Flow', description: 'Kubernetes authentication & authorization' },
  'ci-cd-pipeline': { name: 'CI/CD Pipeline', description: 'Build, test, deploy workflow' },
  'incident-response': { name: 'Incident Response', description: 'On-call alerting & remediation' },
};

function createK8sAuthFlow(): OutlineNode[] {
  return [
    {
      id: generateId(),
      type: 'start',
      label: 'API Request',
      children: [
        {
          id: generateId(),
          type: 'process',
          label: 'Extract Bearer Token',
          children: [
            {
              id: generateId(),
              type: 'decision',
              label: 'Token Present?',
              children: [
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'Yes',
                  children: [
                    {
                      id: generateId(),
                      type: 'process',
                      label: 'Validate JWT Signature',
                      children: [
                        {
                          id: generateId(),
                          type: 'decision',
                          label: 'Signature Valid?',
                          children: [
                            {
                              id: generateId(),
                              type: 'branch',
                              label: 'Yes',
                              children: [
                                {
                                  id: generateId(),
                                  type: 'process',
                                  label: 'Check Token Expiry',
                                  children: [
                                    {
                                      id: generateId(),
                                      type: 'decision',
                                      label: 'Token Expired?',
                                      children: [
                                        {
                                          id: generateId(),
                                          type: 'branch',
                                          label: 'Yes',
                                          children: [
                                            { id: generateId(), type: 'end', label: '401 Token Expired', children: [] },
                                          ],
                                        },
                                        {
                                          id: generateId(),
                                          type: 'branch',
                                          label: 'No',
                                          children: [
                                            {
                                              id: generateId(),
                                              type: 'process',
                                              label: 'Extract ServiceAccount',
                                              children: [
                                                {
                                                  id: generateId(),
                                                  type: 'process',
                                                  label: 'Query RBAC Policies',
                                                  children: [
                                                    {
                                                      id: generateId(),
                                                      type: 'decision',
                                                      label: 'Has Permission?',
                                                      children: [
                                                        {
                                                          id: generateId(),
                                                          type: 'branch',
                                                          label: 'Yes',
                                                          children: [
                                                            {
                                                              id: generateId(),
                                                              type: 'process',
                                                              label: 'Admit Request',
                                                              children: [
                                                                { id: generateId(), type: 'end', label: '200 OK', children: [] },
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                        {
                                                          id: generateId(),
                                                          type: 'branch',
                                                          label: 'No',
                                                          children: [
                                                            {
                                                              id: generateId(),
                                                              type: 'process',
                                                              label: 'Log Denied Access',
                                                              children: [
                                                                { id: generateId(), type: 'end', label: '403 Forbidden', children: [] },
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              id: generateId(),
                              type: 'branch',
                              label: 'No',
                              children: [
                                { id: generateId(), type: 'end', label: '401 Invalid Signature', children: [] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'No',
                  children: [
                    {
                      id: generateId(),
                      type: 'process',
                      label: 'Check Anonymous Access',
                      children: [
                        {
                          id: generateId(),
                          type: 'decision',
                          label: 'Anon Allowed?',
                          children: [
                            {
                              id: generateId(),
                              type: 'branch',
                              label: 'Yes',
                              children: [
                                {
                                  id: generateId(),
                                  type: 'merge',
                                  label: '',
                                  children: [
                                    { id: generateId(), type: 'end', label: '200 OK (Anon)', children: [] },
                                  ],
                                },
                              ],
                            },
                            {
                              id: generateId(),
                              type: 'branch',
                              label: 'No',
                              children: [
                                { id: generateId(), type: 'end', label: '401 Unauthorized', children: [] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function createCICDPipelineFlow(): OutlineNode[] {
  return [
    {
      id: generateId(),
      type: 'start',
      label: 'Git Push',
      children: [
        {
          id: generateId(),
          type: 'process',
          label: 'Trigger Webhook',
          children: [
            {
              id: generateId(),
              type: 'process',
              label: 'Clone Repository',
              children: [
                {
                  id: generateId(),
                  type: 'process',
                  label: 'Install Dependencies',
                  children: [
                    {
                      id: generateId(),
                      type: 'process',
                      label: 'Run Linter',
                      children: [
                        {
                          id: generateId(),
                          type: 'decision',
                          label: 'Lint Pass?',
                          children: [
                            {
                              id: generateId(),
                              type: 'branch',
                              label: 'Yes',
                              children: [
                                {
                                  id: generateId(),
                                  type: 'process',
                                  label: 'Run Unit Tests',
                                  children: [
                                    {
                                      id: generateId(),
                                      type: 'decision',
                                      label: 'Tests Pass?',
                                      children: [
                                        {
                                          id: generateId(),
                                          type: 'branch',
                                          label: 'Yes',
                                          children: [
                                            {
                                              id: generateId(),
                                              type: 'process',
                                              label: 'Build Container Image',
                                              children: [
                                                {
                                                  id: generateId(),
                                                  type: 'process',
                                                  label: 'Push to Registry',
                                                  children: [
                                                    {
                                                      id: generateId(),
                                                      type: 'process',
                                                      label: 'Deploy to Staging',
                                                      children: [
                                                        {
                                                          id: generateId(),
                                                          type: 'process',
                                                          label: 'Run E2E Tests',
                                                          children: [
                                                            {
                                                              id: generateId(),
                                                              type: 'decision',
                                                              label: 'E2E Pass?',
                                                              children: [
                                                                {
                                                                  id: generateId(),
                                                                  type: 'branch',
                                                                  label: 'Yes',
                                                                  children: [
                                                                    {
                                                                      id: generateId(),
                                                                      type: 'decision',
                                                                      label: 'Is Main Branch?',
                                                                      children: [
                                                                        {
                                                                          id: generateId(),
                                                                          type: 'branch',
                                                                          label: 'Yes',
                                                                          children: [
                                                                            {
                                                                              id: generateId(),
                                                                              type: 'process',
                                                                              label: 'Deploy to Production',
                                                                              children: [
                                                                                {
                                                                                  id: generateId(),
                                                                                  type: 'merge',
                                                                                  label: '',
                                                                                  children: [
                                                                                    { id: generateId(), type: 'end', label: 'Pipeline Complete', children: [] },
                                                                                  ],
                                                                                },
                                                                              ],
                                                                            },
                                                                          ],
                                                                        },
                                                                        {
                                                                          id: generateId(),
                                                                          type: 'branch',
                                                                          label: 'No',
                                                                          children: [
                                                                            { id: generateId(), type: 'end', label: 'PR Ready', children: [] },
                                                                          ],
                                                                        },
                                                                      ],
                                                                    },
                                                                  ],
                                                                },
                                                                {
                                                                  id: generateId(),
                                                                  type: 'branch',
                                                                  label: 'No',
                                                                  children: [
                                                                    {
                                                                      id: generateId(),
                                                                      type: 'process',
                                                                      label: 'Rollback Staging',
                                                                      children: [
                                                                        { id: generateId(), type: 'end', label: 'E2E Failed', children: [] },
                                                                      ],
                                                                    },
                                                                  ],
                                                                },
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          id: generateId(),
                                          type: 'branch',
                                          label: 'No',
                                          children: [
                                            { id: generateId(), type: 'end', label: 'Tests Failed', children: [] },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              id: generateId(),
                              type: 'branch',
                              label: 'No',
                              children: [
                                { id: generateId(), type: 'end', label: 'Lint Failed', children: [] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function createIncidentResponseFlow(): OutlineNode[] {
  return [
    {
      id: generateId(),
      type: 'start',
      label: 'Alert Triggered',
      children: [
        {
          id: generateId(),
          type: 'process',
          label: 'Page On-Call Engineer',
          children: [
            {
              id: generateId(),
              type: 'decision',
              label: 'Acknowledged?',
              children: [
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'Yes',
                  children: [
                    {
                      id: generateId(),
                      type: 'process',
                      label: 'Open Incident Channel',
                      children: [
                        {
                          id: generateId(),
                          type: 'process',
                          label: 'Check Dashboards',
                          children: [
                            {
                              id: generateId(),
                              type: 'decision',
                              label: 'Customer Impact?',
                              children: [
                                {
                                  id: generateId(),
                                  type: 'branch',
                                  label: 'Yes',
                                  children: [
                                    {
                                      id: generateId(),
                                      type: 'process',
                                      label: 'Update Status Page',
                                      children: [
                                        {
                                          id: generateId(),
                                          type: 'merge',
                                          label: '',
                                          children: [
                                            {
                                              id: generateId(),
                                              type: 'process',
                                              label: 'Identify Root Cause',
                                              children: [
                                                {
                                                  id: generateId(),
                                                  type: 'decision',
                                                  label: 'Known Issue?',
                                                  children: [
                                                    {
                                                      id: generateId(),
                                                      type: 'branch',
                                                      label: 'Yes',
                                                      children: [
                                                        {
                                                          id: generateId(),
                                                          type: 'process',
                                                          label: 'Apply Runbook Fix',
                                                          children: [
                                                            {
                                                              id: generateId(),
                                                              type: 'merge',
                                                              label: '',
                                                              children: [
                                                                {
                                                                  id: generateId(),
                                                                  type: 'process',
                                                                  label: 'Verify Resolution',
                                                                  children: [
                                                                    {
                                                                      id: generateId(),
                                                                      type: 'decision',
                                                                      label: 'Resolved?',
                                                                      children: [
                                                                        {
                                                                          id: generateId(),
                                                                          type: 'branch',
                                                                          label: 'Yes',
                                                                          children: [
                                                                            {
                                                                              id: generateId(),
                                                                              type: 'process',
                                                                              label: 'Close Incident',
                                                                              children: [
                                                                                {
                                                                                  id: generateId(),
                                                                                  type: 'process',
                                                                                  label: 'Schedule Postmortem',
                                                                                  children: [
                                                                                    { id: generateId(), type: 'end', label: 'Incident Closed', children: [] },
                                                                                  ],
                                                                                },
                                                                              ],
                                                                            },
                                                                          ],
                                                                        },
                                                                        {
                                                                          id: generateId(),
                                                                          type: 'branch',
                                                                          label: 'No',
                                                                          children: [
                                                                            {
                                                                              id: generateId(),
                                                                              type: 'process',
                                                                              label: 'Escalate to Team Lead',
                                                                              children: [
                                                                                { id: generateId(), type: 'end', label: 'Escalated', children: [] },
                                                                              ],
                                                                            },
                                                                          ],
                                                                        },
                                                                      ],
                                                                    },
                                                                  ],
                                                                },
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                    {
                                                      id: generateId(),
                                                      type: 'branch',
                                                      label: 'No',
                                                      children: [
                                                        {
                                                          id: generateId(),
                                                          type: 'process',
                                                          label: 'Investigate Logs',
                                                          children: [
                                                            {
                                                              id: generateId(),
                                                              type: 'process',
                                                              label: 'Attempt Mitigation',
                                                              children: [],
                                                            },
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  id: generateId(),
                                  type: 'branch',
                                  label: 'No',
                                  children: [],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'No (Timeout)',
                  children: [
                    {
                      id: generateId(),
                      type: 'process',
                      label: 'Page Backup On-Call',
                      children: [
                        { id: generateId(), type: 'end', label: 'Escalated to Backup', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function createSampleFlow(key: SampleFlowKey): OutlineNode[] {
  switch (key) {
    case 'k8s-auth':
      return createK8sAuthFlow();
    case 'ci-cd-pipeline':
      return createCICDPipelineFlow();
    case 'incident-response':
      return createIncidentResponseFlow();
  }
}

function createNewDocument(name: string = 'Untitled Flow'): Document {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    nodes: createEmptyNodes(),
    createdAt: now,
    updatedAt: now,
  };
}

function loadDocuments(): Document[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const docs = JSON.parse(stored) as Document[];
      if (docs.length > 0) return docs;
    }
  } catch {
    console.warn('Failed to load documents from localStorage');
  }
  return [createNewDocument()];
}

function saveDocuments(docs: Document[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    console.warn('Failed to save documents to localStorage');
  }
}

function loadActiveDocId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_DOC_KEY);
  } catch {
    return null;
  }
}

function saveActiveDocId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_DOC_KEY, id);
  } catch {
    console.warn('Failed to save active document ID');
  }
}

interface DocumentStore {
  documents: Document[];
  activeDocumentId: string;
  activeDocument: Document;
  saveStatus: SaveStatus;
  createDocument: (name?: string) => string;
  createSampleDocument: (key: SampleFlowKey) => string;
  deleteDocument: (id: string) => void;
  renameDocument: (id: string, name: string) => void;
  switchDocument: (id: string) => void;
  duplicateDocument: (id: string) => string;
}

interface OutlineStore {
  nodes: OutlineNode[];
  focusedId: string | null;
  clipboardNodeId: string | null;
  setFocusedId: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<Pick<OutlineNode, 'label' | 'type'>>) => void;
  setGotoTarget: (gotoNodeId: string, targetId: string) => void;
  findNodeById: (id: string) => OutlineNode | null;
  addSibling: (afterId: string) => string;
  addChild: (parentId: string) => string;
  deleteNode: (id: string) => void;
  indentNode: (id: string) => void;
  outdentNode: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  getAdjacentNodeId: (id: string, direction: 'up' | 'down') => string | null;
  getFirstNodeId: () => string | null;
  getLastNodeId: () => string | null;
  yankNode: (id: string) => void;
  pasteNodeAfter: (afterId: string) => string | null;
  toggleComment: (id: string) => void;
}

type CombinedStore = DocumentStore & OutlineStore;

const StoreContext = createContext<CombinedStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(loadDocuments);
  const [activeDocumentId, setActiveDocumentId] = useState<string>(() => {
    const savedId = loadActiveDocId();
    const docs = loadDocuments();
    if (savedId && docs.some(d => d.id === savedId)) return savedId;
    return docs[0].id;
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [clipboardNodeId, setClipboardNodeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingDocsRef = useRef<Document[] | null>(null);

  const activeDocument = documents.find(d => d.id === activeDocumentId) ?? documents[0];

  // Debounced save effect
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('unsaved');
    pendingDocsRef.current = documents;
    
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('saving');
      
      // Simulate tiny delay for save feedback
      setTimeout(() => {
        if (pendingDocsRef.current) {
          saveDocuments(pendingDocsRef.current);
          pendingDocsRef.current = null;
        }
        setSaveStatus('saved');
      }, 150);
    }, SAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [documents]);

  // Save active doc ID when it changes
  useEffect(() => {
    saveActiveDocId(activeDocumentId);
  }, [activeDocumentId]);

  // Update nodes helper - updates the active document's nodes
  const updateActiveDocNodes = useCallback((updater: (nodes: OutlineNode[]) => OutlineNode[]) => {
    setDocuments(docs => docs.map(doc => 
      doc.id === activeDocumentId 
        ? { ...doc, nodes: updater(doc.nodes), updatedAt: Date.now() }
        : doc
    ));
  }, [activeDocumentId]);

  // Document management
  const createDocument = useCallback((name?: string): string => {
    const newDoc = createNewDocument(name);
    setDocuments(docs => [...docs, newDoc]);
    setActiveDocumentId(newDoc.id);
    return newDoc.id;
  }, []);

  const createSampleDocument = useCallback((key: SampleFlowKey): string => {
    const now = Date.now();
    const flowInfo = SAMPLE_FLOWS[key];
    const newDoc: Document = {
      id: generateId(),
      name: flowInfo.name,
      nodes: createSampleFlow(key),
      createdAt: now,
      updatedAt: now,
    };
    setDocuments(docs => [...docs, newDoc]);
    setActiveDocumentId(newDoc.id);
    return newDoc.id;
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(docs => {
      if (docs.length <= 1) return docs;
      const filtered = docs.filter(d => d.id !== id);
      if (activeDocumentId === id) {
        setActiveDocumentId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeDocumentId]);

  const renameDocument = useCallback((id: string, name: string) => {
    setDocuments(docs => docs.map(doc =>
      doc.id === id ? { ...doc, name, updatedAt: Date.now() } : doc
    ));
  }, []);

  const switchDocument = useCallback((id: string) => {
    setActiveDocumentId(id);
    setFocusedId(null);
  }, []);

  const duplicateDocument = useCallback((id: string): string => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return id;
    
    const newDoc: Document = {
      ...doc,
      id: generateId(),
      name: `${doc.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDocuments(docs => [...docs, newDoc]);
    setActiveDocumentId(newDoc.id);
    return newDoc.id;
  }, [documents]);

  // Outline operations
  const nodes = activeDocument.nodes;

  const findNodeAndParent = useCallback(
    (
      id: string,
      nodeList: OutlineNode[] = nodes,
      parent: OutlineNode | null = null
    ): { node: OutlineNode; parent: OutlineNode | null; siblings: OutlineNode[]; index: number } | null => {
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].id === id) {
          return { node: nodeList[i], parent, siblings: nodeList, index: i };
        }
        const found = findNodeAndParent(id, nodeList[i].children, nodeList[i]);
        if (found) return found;
      }
      return null;
    },
    [nodes]
  );

  const updateNode = useCallback((id: string, updates: Partial<Pick<OutlineNode, 'label' | 'type'>>) => {
    updateActiveDocNodes((prev) => {
      const update = (nodeList: OutlineNode[]): OutlineNode[] =>
        nodeList.map((n) => {
          if (n.id === id) {
            if (n.type === 'branch' && updates.type && updates.type !== 'branch') {
              return n;
            }
            
            let updatedNode = { ...n, ...updates };
            
            const changingToDecision = updates.type === 'decision' && n.type !== 'decision';
            if (changingToDecision) {
              const hasBranches = n.children.some(c => c.type === 'branch');
              if (!hasBranches) {
                updatedNode = {
                  ...updatedNode,
                  children: [
                    { id: generateId(), type: 'branch', label: 'Yes', children: n.children },
                    { id: generateId(), type: 'branch', label: 'No', children: [] },
                  ],
                };
              }
            }
            
            const changingFromDecision = updates.type && updates.type !== 'decision' && n.type === 'decision';
            if (changingFromDecision) {
              updatedNode = {
                ...updatedNode,
                children: n.children.flatMap(c => 
                  c.type === 'branch' ? c.children : [c]
                ),
              };
            }
            
            return updatedNode;
          }
          return { ...n, children: update(n.children) };
        });
      return update(prev);
    });
  }, [updateActiveDocNodes]);

  const addSibling = useCallback(
    (afterId: string): string => {
      const newId = generateId();
      updateActiveDocNodes((prev) => {
        const insert = (nodeList: OutlineNode[]): OutlineNode[] => {
          const idx = nodeList.findIndex((n) => n.id === afterId);
          if (idx !== -1) {
            const siblingNode = nodeList[idx];
            const newType = siblingNode.type === 'branch' ? 'branch' : 'process';
            const newLabel = siblingNode.type === 'branch' ? `Branch ${nodeList.length + 1}` : '';
            const newNode: OutlineNode = { id: newId, type: newType, label: newLabel, children: [] };
            return [...nodeList.slice(0, idx + 1), newNode, ...nodeList.slice(idx + 1)];
          }
          return nodeList.map((n) => ({ ...n, children: insert(n.children) }));
        };
        return insert(prev);
      });
      return newId;
    },
    [updateActiveDocNodes]
  );

  const addChild = useCallback((parentId: string): string => {
    const newId = generateId();
    updateActiveDocNodes((prev) => {
      const insert = (nodeList: OutlineNode[]): OutlineNode[] =>
        nodeList.map((n) =>
          n.id === parentId
            ? { ...n, children: [...n.children, { id: newId, type: 'process' as NodeType, label: '', children: [] }] }
            : { ...n, children: insert(n.children) }
        );
      return insert(prev);
    });
    return newId;
  }, [updateActiveDocNodes]);

  const deleteNode = useCallback((id: string) => {
    const found = findNodeAndParent(id);
    if (!found) return;
    
    if (found.node.type === 'branch' && found.parent?.type === 'decision') {
      const branchSiblings = found.siblings.filter(s => s.type === 'branch');
      if (branchSiblings.length <= 1) return;
    }
    
    updateActiveDocNodes((prev) => {
      const remove = (nodeList: OutlineNode[]): OutlineNode[] =>
        nodeList.filter((n) => n.id !== id).map((n) => ({ ...n, children: remove(n.children) }));
      return remove(prev);
    });
  }, [findNodeAndParent, updateActiveDocNodes]);

  const indentNode = useCallback(
    (id: string) => {
      const found = findNodeAndParent(id);
      if (found?.node.type === 'branch') return;
      
      updateActiveDocNodes((prev) => {
        const indent = (nodeList: OutlineNode[]): OutlineNode[] => {
          const idx = nodeList.findIndex((n) => n.id === id);
          if (idx > 0) {
            const node = nodeList[idx];
            const newPrev = { ...nodeList[idx - 1], children: [...nodeList[idx - 1].children, node] };
            return [...nodeList.slice(0, idx - 1), newPrev, ...nodeList.slice(idx + 1)];
          }
          return nodeList.map((n) => ({ ...n, children: indent(n.children) }));
        };
        return indent(prev);
      });
    },
    [findNodeAndParent, updateActiveDocNodes]
  );

  const outdentNode = useCallback(
    (id: string) => {
      const found = findNodeAndParent(id);
      if (!found || !found.parent) return;
      if (found.node.type === 'branch') return;

      updateActiveDocNodes((prev) => {
        const doOutdent = (nodeList: OutlineNode[]): OutlineNode[] => {
          for (let i = 0; i < nodeList.length; i++) {
            const childIdx = nodeList[i].children.findIndex((c) => c.id === id);
            if (childIdx !== -1) {
              const node = nodeList[i].children[childIdx];
              const newParent = { ...nodeList[i], children: nodeList[i].children.filter((c) => c.id !== id) };
              return [...nodeList.slice(0, i + 1).map((n, j) => (j === i ? newParent : n)), node, ...nodeList.slice(i + 1)];
            }
            const result = doOutdent(nodeList[i].children);
            if (result !== nodeList[i].children) {
              return nodeList.map((n, j) => (j === i ? { ...n, children: result } : n));
            }
          }
          return nodeList;
        };

        return doOutdent(prev);
      });
    },
    [findNodeAndParent, updateActiveDocNodes]
  );

  const flattenIds = useCallback((nodeList: OutlineNode[]): string[] => {
    const result: string[] = [];
    for (const n of nodeList) {
      result.push(n.id);
      result.push(...flattenIds(n.children));
    }
    return result;
  }, []);

  const getAdjacentNodeId = useCallback(
    (id: string, direction: 'up' | 'down'): string | null => {
      const flat = flattenIds(nodes);
      const idx = flat.indexOf(id);
      if (idx === -1) return null;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      return flat[newIdx] ?? null;
    },
    [nodes, flattenIds]
  );

  const moveUp = useCallback((id: string) => {
    updateActiveDocNodes((prev) => {
      const swap = (nodeList: OutlineNode[]): OutlineNode[] => {
        const idx = nodeList.findIndex((n) => n.id === id);
        if (idx > 0) {
          const newList = [...nodeList];
          [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
          return newList;
        }
        return nodeList.map((n) => ({ ...n, children: swap(n.children) }));
      };
      return swap(prev);
    });
  }, [updateActiveDocNodes]);

  const moveDown = useCallback((id: string) => {
    updateActiveDocNodes((prev) => {
      const swap = (nodeList: OutlineNode[]): OutlineNode[] => {
        const idx = nodeList.findIndex((n) => n.id === id);
        if (idx !== -1 && idx < nodeList.length - 1) {
          const newList = [...nodeList];
          [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
          return newList;
        }
        return nodeList.map((n) => ({ ...n, children: swap(n.children) }));
      };
      return swap(prev);
    });
  }, [updateActiveDocNodes]);

  const getFirstNodeId = useCallback((): string | null => {
    const flat = flattenIds(nodes);
    return flat[0] ?? null;
  }, [nodes, flattenIds]);

  const getLastNodeId = useCallback((): string | null => {
    const flat = flattenIds(nodes);
    return flat[flat.length - 1] ?? null;
  }, [nodes, flattenIds]);

  const yankNode = useCallback((id: string) => {
    setClipboardNodeId(id);
  }, []);

  const findNode = useCallback((id: string, nodeList: OutlineNode[] = nodes): OutlineNode | null => {
    for (const n of nodeList) {
      if (n.id === id) return n;
      const found = findNode(id, n.children);
      if (found) return found;
    }
    return null;
  }, [nodes]);

  const deepCloneNode = useCallback((node: OutlineNode): OutlineNode => {
    return {
      ...node,
      id: generateId(),
      children: node.children.map(deepCloneNode),
    };
  }, []);

  const pasteNodeAfter = useCallback((afterId: string): string | null => {
    if (!clipboardNodeId) return null;
    const nodeToCopy = findNode(clipboardNodeId);
    if (!nodeToCopy) return null;

    const cloned = deepCloneNode(nodeToCopy);
    
    updateActiveDocNodes((prev) => {
      const insert = (nodeList: OutlineNode[]): OutlineNode[] => {
        const idx = nodeList.findIndex((n) => n.id === afterId);
        if (idx !== -1) {
          return [...nodeList.slice(0, idx + 1), cloned, ...nodeList.slice(idx + 1)];
        }
        return nodeList.map((n) => ({ ...n, children: insert(n.children) }));
      };
      return insert(prev);
    });
    
    return cloned.id;
  }, [clipboardNodeId, findNode, deepCloneNode, updateActiveDocNodes]);

  const setGotoTarget = useCallback((gotoNodeId: string, targetId: string) => {
    updateActiveDocNodes((prev) => {
      const update = (nodeList: OutlineNode[]): OutlineNode[] =>
        nodeList.map((n) =>
          n.id === gotoNodeId
            ? { ...n, targetId }
            : { ...n, children: update(n.children) }
        );
      return update(prev);
    });
  }, [updateActiveDocNodes]);

  const toggleComment = useCallback((id: string) => {
    updateActiveDocNodes((prev) => {
      const toggle = (nodeList: OutlineNode[]): OutlineNode[] =>
        nodeList.map((n) =>
          n.id === id
            ? { ...n, isComment: !n.isComment }
            : { ...n, children: toggle(n.children) }
        );
      return toggle(prev);
    });
  }, [updateActiveDocNodes]);

  const findNodeById = useCallback((id: string): OutlineNode | null => {
    return findNode(id);
  }, [findNode]);

  return (
    <StoreContext.Provider
      value={{
        // Document store
        documents,
        activeDocumentId,
        activeDocument,
        saveStatus,
        createDocument,
        createSampleDocument,
        deleteDocument,
        renameDocument,
        switchDocument,
        duplicateDocument,
        // Outline store
        nodes,
        focusedId,
        clipboardNodeId,
        setFocusedId,
        updateNode,
        setGotoTarget,
        findNodeById,
        addSibling,
        addChild,
        deleteNode,
        indentNode,
        outdentNode,
        moveUp,
        moveDown,
        getAdjacentNodeId,
        getFirstNodeId,
        getLastNodeId,
        yankNode,
        pasteNodeAfter,
        toggleComment,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): CombinedStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Convenience hooks
export function useDocuments() {
  const store = useStore();
  return {
    documents: store.documents,
    activeDocumentId: store.activeDocumentId,
    activeDocument: store.activeDocument,
    saveStatus: store.saveStatus,
    createDocument: store.createDocument,
    createSampleDocument: store.createSampleDocument,
    deleteDocument: store.deleteDocument,
    renameDocument: store.renameDocument,
    switchDocument: store.switchDocument,
    duplicateDocument: store.duplicateDocument,
  };
}

export function useOutline() {
  const store = useStore();
  return {
    nodes: store.nodes,
    focusedId: store.focusedId,
    clipboardNodeId: store.clipboardNodeId,
    setFocusedId: store.setFocusedId,
    updateNode: store.updateNode,
    setGotoTarget: store.setGotoTarget,
    findNodeById: store.findNodeById,
    addSibling: store.addSibling,
    addChild: store.addChild,
    deleteNode: store.deleteNode,
    indentNode: store.indentNode,
    outdentNode: store.outdentNode,
    moveUp: store.moveUp,
    moveDown: store.moveDown,
    getAdjacentNodeId: store.getAdjacentNodeId,
    getFirstNodeId: store.getFirstNodeId,
    getLastNodeId: store.getLastNodeId,
    yankNode: store.yankNode,
    pasteNodeAfter: store.pasteNodeAfter,
    toggleComment: store.toggleComment,
  };
}
