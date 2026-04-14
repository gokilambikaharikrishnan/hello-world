export interface FolderGroup {
    layer: string;
    fullName: string;
    description: string;
    color: string;
    icon: string;
    group: 'BSW' | 'ASW' | 'Unknown';
    folders: string[];
}
