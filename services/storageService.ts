import { openDB, DBSchema } from 'idb';
import { Proyecto, DocumentoRequerido, EstadoProyecto } from '../types';

interface CuraduriaDB extends DBSchema {
  projects: {
    key: string;
    value: Proyecto;
    indexes: { 'by-date': string };
  };
  files: {
    key: string; // Composite key: projectId_docId
    value: {
      id: string;
      projectId: string;
      docId: string;
      file: File;
      category: string;
      uploadedAt: Date;
    };
    indexes: { 'by-project': string };
  };
}

const DB_NAME = 'curaduria-digital-db';
const DB_VERSION = 1;

const getDB = async () => {
  return openDB<CuraduriaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for Project Metadata
      const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
      projectStore.createIndex('by-date', 'fechaRadicacion');

      // Store for Large Binary Files
      const fileStore = db.createObjectStore('files', { keyPath: 'id' });
      fileStore.createIndex('by-project', 'projectId');
    },
  });
};

export const saveProject = async (project: Proyecto, documents: DocumentoRequerido[], filesMap: Map<string, File>) => {
  const db = await getDB();
  const tx = db.transaction(['projects', 'files'], 'readwrite');
  
  // 1. Save Project Metadata
  await tx.objectStore('projects').put(project);

  // 2. Save Files (Blobs)
  const fileStore = tx.objectStore('files');
  
  // Create promises for file storage
  const filePromises = documents.map(doc => {
    const file = filesMap.get(doc.id);
    if (file) {
      return fileStore.put({
        id: `${project.id}_${doc.id}`,
        projectId: project.id,
        docId: doc.id,
        file: file,
        category: doc.categoria,
        uploadedAt: new Date()
      });
    }
    return Promise.resolve();
  });

  await Promise.all(filePromises);
  await tx.done;
  console.log('Project and files saved successfully to IndexedDB');
};

export const getAllProjects = async (): Promise<Proyecto[]> => {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-date');
};

export const getProjectFiles = async (projectId: string) => {
  const db = await getDB();
  return db.getAllFromIndex('files', 'by-project', projectId);
};

export const clearDatabase = async () => {
    const db = await getDB();
    await db.clear('projects');
    await db.clear('files');
};