import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { api, ApiError } from '../../../lib/api';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { IfnsSearch } from '../../../components/IfnsSearch';
import { useBreakpoints } from '../../../hooks/useBreakpoints';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

// ---------------------------------------------------------------------------
// File attachment item (Feather icons, NativeWind)
// ---------------------------------------------------------------------------

function FileItem({ name, size, onRemove }: { name: string; size: string; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-borderLight bg-bgSurface px-3 py-2">
      <Feather name="file" size={16} color={Colors.brandPrimary} />
      <View className="flex-1">
        <Text className="text-sm text-textPrimary" numberOfLines={1}>{name}</Text>
        <Text className="text-xs text-textMuted">{size}</Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={16} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Format file size for display
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const { specialist } = useLocalSearchParams<{ specialist?: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [budget, setBudget] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [fileError, setFileError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string; city?: string; budget?: string }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  // --- File logic (preserved) ---

  function addFiles(files: SelectedFile[]) {
    setFileError(undefined);
    const remaining = MAX_FILES - selectedFiles.length;
    if (remaining <= 0) {
      setFileError(`Максимум ${MAX_FILES} файлов`);
      return;
    }
    const toAdd: SelectedFile[] = [];
    for (const f of files) {
      if (toAdd.length >= remaining) {
        setFileError(`Максимум ${MAX_FILES} файлов`);
        break;
      }
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_MIME_TYPES.includes(f.mimeType) && !ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError('Допустимые форматы: PDF, JPG, PNG');
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError('Максимальный размер файла — 10 МБ');
        continue;
      }
      toAdd.push(f);
    }
    if (toAdd.length > 0) {
      setSelectedFiles((prev) => [...prev, ...toAdd]);
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(undefined);
  }

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const files: SelectedFile[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.name ?? 'document.pdf',
        mimeType: a.mimeType ?? 'application/pdf',
        size: a.size ?? 0,
      }));
      addFiles(files);
    } catch {
      Alert.alert('Ошибка', 'Не удалось выбрать документ');
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const files: SelectedFile[] = result.assets.map((a) => {
        const uriParts = a.uri.split('/');
        const fileName = a.fileName ?? uriParts[uriParts.length - 1] ?? 'image.jpg';
        const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        return {
          uri: a.uri,
          name: fileName,
          mimeType,
          size: a.fileSize ?? 0,
        };
      });
      addFiles(files);
    } catch {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  }

  // --- Validation (preserved) ---

  function validate(): boolean {
    const e: typeof errors = {};
    if (title.trim().length < 3) {
      e.title = 'Минимум 3 символа';
    } else if (title.trim().length > 100) {
      e.title = 'Максимум 100 символов';
    }
    if (description.trim().length < 10) {
      e.description = 'Минимум 10 символов';
    }
    if (!city.trim() && !selectedIfns) {
      e.city = 'Укажите город или выберите ИФНС';
    }
    if (budget.trim() && (isNaN(Number(budget)) || Number(budget) < 0 || !Number.isInteger(Number(budget)))) {
      e.budget = 'Введите целое число';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
    return Object.keys(e).length === 0;
  }

  // --- Upload & Submit (preserved) ---

  async function uploadFiles(requestId: string) {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);
    }
    await api.upload(`/requests/${requestId}/documents`, formData);
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const effectiveCity = selectedIfns ? selectedIfns.city.name : city.trim();
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        city: effectiveCity,
        isPublic: false,
      };
      if (selectedIfns) {
        body.ifnsId = selectedIfns.id;
        body.ifnsName = selectedIfns.name;
      }
      if (budget.trim()) body.budget = Number(budget.trim());
      const created = await api.post<{ id: string }>('/requests', body);
      try {
        await uploadFiles(created.id);
      } catch (uploadErr) {
        const msg = uploadErr instanceof ApiError ? uploadErr.message : 'Файлы не удалось загрузить';
        Alert.alert('Запрос создан', `Но файлы не загружены: ${msg}`);
      }
      router.replace('/(dashboard)/my-requests');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось создать запрос';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  }

  // --- UI (NativeWind, matching proto) ---

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isMobile && (
        <Header
          title="Новый запрос"
          showBack
          breadcrumbs={[
            { label: 'Мои запросы', route: '/(dashboard)/my-requests' },
            { label: 'Новый запрос' },
          ]}
        />
      )}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full" style={!isMobile ? { maxWidth: 680, alignSelf: 'center' } : undefined}>
            <Text className="mb-4 text-xl font-bold text-textPrimary">Новая заявка</Text>

            {specialist ? (
              <Text className="mb-2 text-sm font-medium text-brandPrimary">
                Запрос увидят специалисты в вашем городе
              </Text>
            ) : null}

            {/* IFNS Search (real API) */}
            <View className="mb-4 gap-1">
              <Text className="text-sm font-medium text-textSecondary">Налоговая инспекция</Text>
              <IfnsSearch
                selected={selectedIfns}
                onSelect={(ifns) => {
                  setSelectedIfns(ifns);
                  if (ifns) {
                    setCity(ifns.city.name);
                    if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
                  }
                }}
                placeholder="Введите номер или название ИФНС..."
              />
            </View>

            {/* City */}
            <View className="mb-4 gap-1">
              <Text className="text-sm font-medium text-textSecondary">Город</Text>
              <TextInput
                value={selectedIfns ? selectedIfns.city.name : city}
                onChangeText={(t) => {
                  setCity(t);
                  if (selectedIfns) setSelectedIfns(null);
                  if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
                }}
                placeholder="Например, Москва"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                className={`h-12 rounded-xl border bg-white px-4 text-base text-textPrimary ${errors.city ? 'border-statusError' : 'border-borderLight'}`}
                style={{ outlineStyle: 'none' } as any}
              />
              {errors.city && <Text className="text-xs text-statusError">{errors.city}</Text>}
            </View>

            {/* Title */}
            <View className="mb-4 gap-1">
              <Text className="text-sm font-medium text-textSecondary">Заголовок</Text>
              <TextInput
                value={title}
                onChangeText={(t) => {
                  if (t.length <= 100) setTitle(t);
                  if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
                }}
                placeholder="Кратко опишите задачу"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="sentences"
                maxLength={100}
                className={`h-12 rounded-xl border bg-white px-4 text-base text-textPrimary ${errors.title ? 'border-statusError' : 'border-borderLight'}`}
                style={{ outlineStyle: 'none' } as any}
              />
              {errors.title && <Text className="text-xs text-statusError">{errors.title}</Text>}
            </View>

            {/* Description */}
            <View className="mb-4 gap-1">
              <Text className="text-sm font-medium text-textSecondary">Описание</Text>
              <TextInput
                value={description}
                onChangeText={(t) => {
                  if (t.length <= 2000) setDescription(t);
                  if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
                }}
                placeholder="Подробно опишите, что нужно сделать..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={2000}
                className={`min-h-[96px] rounded-xl border bg-white p-4 text-base text-textPrimary ${errors.description ? 'border-statusError' : 'border-borderLight'}`}
                style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
              />
              <View className="flex-row items-center justify-between">
                {errors.description ? (
                  <Text className="text-xs text-statusError">{errors.description}</Text>
                ) : <View />}
                <Text className="text-xs text-textMuted">{description.length}/2000</Text>
              </View>
            </View>

            {/* Budget */}
            <View className="mb-4 gap-1">
              <Text className="text-sm font-medium text-textSecondary">Бюджет (необязательно)</Text>
              <TextInput
                value={budget}
                onChangeText={(t) => {
                  setBudget(t);
                  if (errors.budget) setErrors((e) => ({ ...e, budget: undefined }));
                }}
                placeholder="Например, 5000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                className={`h-12 rounded-xl border bg-white px-4 text-base text-textPrimary ${errors.budget ? 'border-statusError' : 'border-borderLight'}`}
                style={{ outlineStyle: 'none' } as any}
              />
              {errors.budget && <Text className="text-xs text-statusError">{errors.budget}</Text>}
            </View>

            {/* Files */}
            <View className="mb-4 gap-2">
              <Text className="text-sm font-medium text-textSecondary">Файлы</Text>
              {selectedFiles.map((file, index) => (
                <FileItem
                  key={`${file.name}-${index}`}
                  name={file.name}
                  size={formatFileSize(file.size)}
                  onRemove={() => removeFile(index)}
                />
              ))}
              <View className="flex-row gap-2">
                <Pressable
                  className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-dashed border-borderLight bg-bgSurface"
                  onPress={pickDocument}
                  disabled={selectedFiles.length >= MAX_FILES}
                  style={selectedFiles.length >= MAX_FILES ? { opacity: 0.5 } : undefined}
                >
                  <Feather name="file-text" size={16} color={Colors.brandPrimary} />
                  <Text className="text-sm font-medium text-brandPrimary">PDF</Text>
                </Pressable>
                <Pressable
                  className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-dashed border-borderLight bg-bgSurface"
                  onPress={pickImage}
                  disabled={selectedFiles.length >= MAX_FILES}
                  style={selectedFiles.length >= MAX_FILES ? { opacity: 0.5 } : undefined}
                >
                  <Feather name="image" size={16} color={Colors.brandPrimary} />
                  <Text className="text-sm font-medium text-brandPrimary">Фото</Text>
                </Pressable>
              </View>
              <Text className="text-xs text-textMuted">PDF, JPG, PNG до 10 МБ. Макс. {MAX_FILES} файлов.</Text>
              {fileError && <Text className="text-xs text-statusError">{fileError}</Text>}
            </View>

            {/* Submit (inline, not sticky) */}
            <Pressable
              className="mt-2 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
              onPress={handleSubmit}
              disabled={loading}
              style={loading ? { opacity: 0.7 } : undefined}
            >
              <Feather name="send" size={16} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white">
                {loading ? 'Отправка...' : 'Отправить заявку'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
