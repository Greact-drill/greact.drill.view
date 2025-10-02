// src/api/admin.ts
import { apiClient } from './client';

// Тип для создания/обновления
interface EdgePayload {
    id: string;
    name: string;
}

export type Edge = EdgePayload;

// 1. ПОЛУЧЕНИЕ: GET /edge
export async function getEdgesForAdmin(): Promise<EdgePayload[]> {
    const response = await apiClient.get<EdgePayload[]>('/edge');
    return response.data;
}

// 2. СОЗДАНИЕ: POST /edge
export async function createEdge(data: EdgePayload): Promise<EdgePayload> {
    const response = await apiClient.post<EdgePayload>('/edge', data);
    return response.data;
}

// 3. ОБНОВЛЕНИЕ: PATCH /edge/:id
export async function updateEdge(id: string, data: Partial<EdgePayload>): Promise<EdgePayload> {
    // В Postman используется PATCH /edge/DrillEdge1
    const response = await apiClient.patch<EdgePayload>(`/edge/${id}`, data);
    return response.data;
}

// 4. УДАЛЕНИЕ: DELETE /edge/:id
export async function deleteEdge(id: string): Promise<void> {
    // В Postman используется DELETE /edge/DrillEdge1
    await apiClient.delete(`/edge/${id}`);
}

export interface BlockPayload {
    id: string;
    name: string;
    edge_id: string; // Требуется для создания блока, как видно из Postman
}

export type Block = BlockPayload;

// 1. ПОЛУЧЕНИЕ: GET /block
export async function getBlocksForAdmin(): Promise<Block[]> {
    const response = await apiClient.get<Block[]>('/block');
    return response.data;
}

// 2. СОЗДАНИЕ: POST /block
export async function createBlock(data: BlockPayload): Promise<Block> {
    const response = await apiClient.post<Block>('/block', data);
    return response.data;
}

// 3. ОБНОВЛЕНИЕ: PATCH /block/:id
export async function updateBlock(id: string, data: Partial<BlockPayload>): Promise<Block> {
    const response = await apiClient.patch<Block>(`/block/${id}`, data);
    return response.data;
}

// 4. УДАЛЕНИЕ: DELETE /block/:id
export async function deleteBlock(id: string): Promise<void> {
    await apiClient.delete(`/block/${id}`);
}

export interface TagPayload {
    id: string;
    name: string;
    min: number;
    max: number;
    comment: string;
    unit_of_measurement: string;
}
export type Tag = TagPayload;

// 1. ПОЛУЧЕНИЕ: GET /tag
export async function getTagsForAdmin(): Promise<Tag[]> {
    const response = await apiClient.get<Tag[]>('/tag');
    return response.data;
}

// 2. СОЗДАНИЕ: POST /tag
export async function createTag(data: TagPayload): Promise<Tag> {
    const response = await apiClient.post<Tag>('/tag', data);
    return response.data;
}

// 3. ОБНОВЛЕНИЕ: PATCH /tag/:id
export async function updateTag(id: string, data: Partial<TagPayload>): Promise<Tag> {
    const response = await apiClient.patch<Tag>(`/tag/${id}`, data);
    return response.data;
}

// 4. УДАЛЕНИЕ: DELETE /tag/:id
export async function deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/tag/${id}`);
}

// ---------------------------------------------------------------------------------
// --- НОВЫЕ ТИПЫ И CRUD ДЛЯ КАСТОМИЗАЦИИ (Customization) ---
// ---------------------------------------------------------------------------------

export interface CustomizationPayload {
    key: string;
    value: string;
}

// Базовый тип для Edge/Block Customization
export interface BaseCustomization extends CustomizationPayload {
    edge_id?: string;
    block_id?: string;
}

// Тип для Tag Customization (требует двух ключей)
export interface TagCustomization extends CustomizationPayload {
    edge_id: string;
    tag_id: string;
}

// --- 1. Edge Customization ---
// Для Edge Customization (зависит только от Edge ID + Key)
export async function getEdgeCustomizationForAdmin(): Promise<BaseCustomization[]> {
    // В отличие от других, здесь нет одного родительского ID для всех, 
    // поэтому будем получать данные через более общий запрос, или, если API не поддерживает, 
    // нужно будет загружать по каждому Edge ID. Для простоты, сделаем общий.
    const response = await apiClient.get<BaseCustomization[]>('/edge-customization');
    return response.data;
}
export async function createEdgeCustomization(data: { edge_id: string } & CustomizationPayload): Promise<BaseCustomization> {
    const response = await apiClient.post<BaseCustomization>('/edge-customization', data);
    return response.data;
}
export async function updateEdgeCustomization(edgeId: string, key: string, data: Partial<CustomizationPayload>): Promise<BaseCustomization> {
    const response = await apiClient.patch<BaseCustomization>(`/edge-customization/${edgeId}/${key}`, data);
    return response.data;
}
export async function deleteEdgeCustomization(edgeId: string, key: string): Promise<void> {
    await apiClient.delete(`/edge-customization/${edgeId}/${key}`);
}


// --- 2. Block Customization ---
// Для Block Customization (зависит только от Block ID + Key)
export async function getBlockCustomizationForAdmin(): Promise<BaseCustomization[]> {
    const response = await apiClient.get<BaseCustomization[]>('/block-customization');
    return response.data;
}
export async function createBlockCustomization(data: { block_id: string } & CustomizationPayload): Promise<BaseCustomization> {
    const response = await apiClient.post<BaseCustomization>('/block-customization', data);
    return response.data;
}
export async function updateBlockCustomization(blockId: string, key: string, data: Partial<CustomizationPayload>): Promise<BaseCustomization> {
    const response = await apiClient.patch<BaseCustomization>(`/block-customization/${blockId}/${key}`, data);
    return response.data;
}
export async function deleteBlockCustomization(blockId: string, key: string): Promise<void> {
    await apiClient.delete(`/block-customization/${blockId}/${key}`);
}


// --- 3. Tag Customization ---
// Для Tag Customization (зависит от Edge ID + Tag ID + Key)
export async function getTagCustomizationForAdmin(): Promise<TagCustomization[]> {
    const response = await apiClient.get<TagCustomization[]>('/tag-customization');
    return response.data;
}
export async function createTagCustomization(data: TagCustomization): Promise<TagCustomization> {
    const response = await apiClient.post<TagCustomization>('/tag-customization', data);
    return response.data;
}
export async function updateTagCustomization(edgeId: string, tagId: string, key: string, data: Partial<CustomizationPayload>): Promise<TagCustomization> {
    const response = await apiClient.patch<TagCustomization>(`/tag-customization/${edgeId}/${tagId}/${key}`, data);
    return response.data;
}
export async function deleteTagCustomization(edgeId: string, tagId: string, key: string): Promise<void> {
    await apiClient.delete(`/tag-customization/${edgeId}/${tagId}/${key}`);
}