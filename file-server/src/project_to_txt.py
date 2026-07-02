import os

def collect_code(project_path, output_file, ignore_dirs=None, extensions=None):
    if ignore_dirs is None:
        # Список папок, которые стоит игнорировать
        ignore_dirs = {'.git', '__pycache__', 'node_modules', 'venv', '.venv', 'dist', 'build', '.zed'}

    if extensions is None:
        # Укажите расширения файлов, которые нужно собирать
        extensions = {'.py', '.cpp', '.h', '.js', '.ts', '.json', '.txt', '.yaml', '.yml'}

    with open(output_file, 'w', encoding='utf-8') as f_out:
        for root, dirs, files in os.walk(project_path):
            # Фильтруем папки-исключения
            dirs[:] = [d for d in dirs if d not in ignore_dirs]

            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, project_path)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f_in:
                            code = f_in.read()

                        f_out.write(f"\n{'='*80}\n")
                        f_out.write(f"FILE: {relative_path}\n")
                        f_out.write(f"{'='*80}\n\n")
                        f_out.write(code)
                        f_out.write("\n")
                    except Exception as e:
                        print(f"Ошибка при чтении {relative_path}: {e}")

if __name__ == "__main__":
    # Укажите путь к вашему проекту ( '.' для текущей папки)
    path_to_project = '.'
    # Имя итогового файла
    output_name = 'full_project_code.txt'

    collect_code(path_to_project, output_name)
    print(f"Готово! Весь код сохранен в {output_name}")
