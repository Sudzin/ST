import os

# Файл, куда запишется весь результат
OUTPUT_FILE = "project_snapshot.txt"

# Что мы ХОТИМ прочитать и проанализировать
ALLOWED_EXTENSIONS = {'.ts', '.tsx', '.json', '.js', '.html'}

# Что мы КАТЕГОРИЧЕСКИ игнорируем
IGNORE_DIRS = {'node_modules', 'Документы', 'uploads', '.git'}
IGNORE_FILES = {
    'package-lock.json', 'project_snapshot.txt', 'project_to_txt.py',
    'data.db', 'data.db-wal', 'data.db-shm', 'test.db'
}

def build_snapshot():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk('.'):
            # Фильтруем папки на лету
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                # Пропускаем тесты и мусорные файлы
                if file in IGNORE_FILES or file.startswith('test-') or file.startswith('test.'):
                    continue

                # Проверяем расширение
                ext = os.path.splitext(file)[1]
                if ext in ALLOWED_EXTENSIONS:
                    full_path = os.path.join(root, file)

                    outfile.write(f"\n{'='*50}\n")
                    outfile.write(f"FILE: {full_path}\n")
                    outfile.write(f"{'='*50}\n\n") # <-- Здесь была опечатка, теперь всё чётко!

                    try:
                        with open(full_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"[Ошибка чтения файла: {e}]\n")
                    outfile.write("\n")

    print(f" Готово! Все важные файлы собраны в: {OUTPUT_FILE}")

if __name__ == "__main__":
    build_snapshot()
