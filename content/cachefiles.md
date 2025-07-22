# Кеш-файлы

## `zwylib.CacheFile`

```python
zwylib.CacheFile(filename: str, read_on_init=True, compress=False)
```

Класс для работы с кеш-файлом. Поддерживает автоматическое чтение, запись и сжатие данных. Используется для хранения простых данных.

### Аргументы

* `filename` (`str`): Имя кеш-файла (например, `cache.bin`). Будет создан в подпапке `cache` директории плагина.
* `read_on_init` (`bool`): Автоматически читать содержимое файла при создании объекта. По умолчанию `True`.
* `compress` (`bool`): Использовать zlib-сжатие при чтении/записи. По умолчанию `False`.

### Методы

#### `read()`

```python
CacheFile.read() -> None
```

Читает содержимое файла и сохраняет в `self.content`. Если включено сжатие (`compress=True`), содержимое будет автоматически распаковано. При ошибке или отсутствии файла — `content` станет `None`.

---

#### `write()`

```python
CacheFile.write() -> None
```

Записывает текущее содержимое `self.content` в файл. Если включено сжатие, данные будут сжаты через [`zlib`](https://docs.python.org/3/library/zlib.html).

---

#### `wipe()`

```python
CacheFile.wipe() -> None
```

Очищает `self.content` (устанавливает в `None`) и сохраняет пустое значение в файл.

---

#### `delete()`

```python
CacheFile.delete() -> None
```

Удаляет файл с диска, если он существует. Если нет прав доступа — логирует предупреждение, но не кидает исключение.

---

### Свойства

#### `content: Optional[bytes]`

Содержимое. Чтение — возвращает `bytes` или `None`. Присваивание — принимает `bytes` или `None`.

---

### Пример

```python
cache = CacheFile("mycache.bin", compress=True)
cache.content = b"some binary data"
cache.write()
```

---

## `zwylib.JsonCacheFile`

```python
zwylib.JsonCacheFile(
	filename: str,
	default: Any,
	read_on_init=True,
	compress=False
)
```

Дочерний класс [`zwylib.CacheFile`](/cachefiles#zwylibcachefile), сохраняющий JSON-совместимые структуры (словарь, список и т.д.). Автоматически сериализует и десериализует содержимое.

### Аргументы

* `filename` (`str`): Имя кеш-файла.
* `default` (`Any`): Значение, которое будет использоваться как начальное содержимое, если файл не найден или повреждён.
* `read_on_init` (`bool`): Чтение содержимого при инициализации. По умолчанию `True`.
* `compress` (`bool`): Использовать zlib-сжатие. По умолчанию `False`.

---

### Методы

#### `read()`

```python
JsonCacheFile.read() -> None
```

Читает содержимое из файла, затем пытается распарсить JSON. Если файл невалидный или не декодируется — `content` сбрасывается в `default`.

---

#### `write()`

```python
JsonCacheFile.write() -> None
```

Сериализует содержимое и записывает в файл как `utf-8`.

---

#### `wipe()`

```python
JsonCacheFile.wipe() -> None
```

Сбрасывает `json_content` в `default` и сохраняет.

---

#### `delete()`

```python
JsonCacheFile.delete() -> None
```

Удаляет файл с диска, если он существует. Если нет прав доступа — логирует предупреждение, но не кидает исключение.

---

### Свойства

#### `content: Any`

Чтение — возвращает текущее содержимое в виде Python-объекта (`dict`, `list` и т.п.). Если файл не был прочитан — возвращается `default`. Запись — принимает JSON-совместимый объект.

---

### Пример

```python
default_value = {"last_run": "2025-07-21"}
json_cache = JsonCacheFile("meta.json", default=default_value)

print(json_cache.content["last_run"])
# "2025-07-21"

json_cache.content["last_run"] = "2025-07-22"
json_cache.write()
```
