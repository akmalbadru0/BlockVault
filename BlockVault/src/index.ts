import { v4 as uuidv4 } from 'uuid';
import { ic, nat64, StableBTreeMap, blob, $query, $update } from 'azle';

// Define the structure for file metadata
class FileMetadata {
    id: string;
    fileName: string;
    fileSize: nat64;
    fileType: string;
    uploadedAt: nat64;
    updatedAt: nat64 | null;
}

// StableBTreeMap for file metadata, key is the file ID, value is metadata
const fileMetadataStorage = new StableBTreeMap<string, FileMetadata>(0, 44, 1024);

// StableBTreeMap for storing the actual file data (binary blob)
const fileStorage = new StableBTreeMap<string, blob>(1, 44, 1024);

// Helper function to get current time in nanoseconds
function getCurrentTime(): nat64 {
    return ic.time() as nat64;
}

// Upload a new file (metadata + file content)
$update;
export function uploadFile(fileName: string, fileSize: nat64, fileType: string, fileContent: blob): FileMetadata {
    const fileId = uuidv4();
    const uploadedAt = getCurrentTime();

    // Create file metadata
    const fileMetadata: FileMetadata = {
        id: fileId,
        fileName,
        fileSize,
        fileType,
        uploadedAt,
        updatedAt: null
    };

    // Store metadata and file content in the respective maps
    fileMetadataStorage.insert(fileId, fileMetadata);
    fileStorage.insert(fileId, fileContent);

    return fileMetadata;
}

// Retrieve metadata for all files
$query;
export function getAllFiles(): FileMetadata[] {
    return fileMetadataStorage.values();
}

// Retrieve a single file's metadata and content by file ID
$query;
export function getFileById(fileId: string): [FileMetadata, blob] | string {
    const fileMetadataOpt = fileMetadataStorage.get(fileId);
    const fileContentOpt = fileStorage.get(fileId);

    if (fileMetadataOpt === undefined || fileContentOpt === undefined) {
        return `File with id=${fileId} not found`;
    }

    return [fileMetadataOpt, fileContentOpt];
}

// Update an existing file's metadata (not the content)
$update;
export function updateFileMetadata(fileId: string, fileName: string, fileType: string): FileMetadata | string {
    const fileMetadataOpt = fileMetadataStorage.get(fileId);

    if (fileMetadataOpt === undefined) {
        return `File with id=${fileId} not found`;
    }

    // Update metadata with new values
    const updatedMetadata: FileMetadata = {
        ...fileMetadataOpt,
        fileName,
        fileType,
        updatedAt: getCurrentTime()
    };

    // Save the updated metadata
    fileMetadataStorage.insert(fileId, updatedMetadata);
    return updatedMetadata;
}

// Delete a file (both metadata and content)
$update;
export function deleteFile(fileId: string): FileMetadata | string {
    const deletedFileMetadata = fileMetadataStorage.remove(fileId);
    const deletedFileContent = fileStorage.remove(fileId);

    if (deletedFileMetadata === undefined || deletedFileContent === undefined) {
        return `File with id=${fileId} not found`;
    }

    return deletedFileMetadata;
}
