# Cache Files

## `zwylib.CacheFile`

```python
zwylib.CacheFile(filename: str, read_on_init=True, compress=False)
```

A class for working with a cache file. Supports automatic reading, writing, and optional compression. Used to store simple binary data.

### Arguments

* `filename` (`str`): Name of the cache file (e.g., `cache.bin`). It will be created inside the plugin's `cache` subfolder.
* `read_on_init` (`bool`): Automatically read the file contents on object creation. Defaults to `True`.
* `compress` (`bool`): Use zlib compression when reading/writing. Defaults to `False`.

### Methods

#### `read()`

```python
CacheFile.read() -> None
```

Reads the contents of the file and stores it in `self.content`. If compression is enabled (`compress=True`), the content is automatically decompressed. If an error occurs or the file is missing, `content` will be set to `None`.

---

#### `write()`

```python
CacheFile.write() -> None
```

Writes the current content of `self.content` to the file. If compression is enabled, the data will be compressed using [`zlib`](https://docs.python.org/3/library/zlib.html).

---

#### `wipe()`

```python
CacheFile.wipe() -> None
```

Clears `self.content` (sets it to `None`) and writes an empty value to the file.

---

#### `delete()`

```python
CacheFile.delete() -> None
```

Deletes the file from disk if it exists. If access is denied — logs a warning but does not throw an exception.

---

### Properties

#### `content: Optional[bytes]`

Contents of the cache. Reading returns `bytes` or `None`. Writing accepts `bytes` or `None`.

---

### Example

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

A subclass of [`zwylib.CacheFile`](/cachefiles#zwylibcachefile) for storing JSON-compatible structures (dicts, lists, etc.). Automatically serializes and deserializes the content.

### Arguments

* `filename` (`str`): Name of the cache file.
* `default` (`Any`): Value to be used as initial content if the file is missing or corrupted.
* `read_on_init` (`bool`): Whether to read contents on init. Defaults to `True`.
* `compress` (`bool`): Whether to use zlib compression. Defaults to `False`.

---

### Methods

#### `read()`

```python
JsonCacheFile.read() -> None
```

Reads contents from file and tries to parse it as JSON. If the file is invalid or not decodable — resets `content` to `default`.

---

#### `write()`

```python
JsonCacheFile.write() -> None
```

Serializes content and writes it to file in UTF-8.

---

#### `wipe()`

```python
JsonCacheFile.wipe() -> None
```

Resets `json_content` to `default` and saves the file.

---

#### `delete()`

```python
JsonCacheFile.delete() -> None
```

Deletes the file from disk if it exists. If access is denied — logs a warning but does not throw an exception.

---

### Properties

#### `content: Any`

Reading returns the current content as a Python object (`dict`, `list`, etc.). If the file was not read — returns `default`. Writing accepts any JSON-serializable object.

---

### Example

```python
default_value = {"last_run": "2025-07-21"}
json_cache = JsonCacheFile("meta.json", default=default_value)

print(json_cache.content["last_run"])
# "2025-07-21"

json_cache.content["last_run"] = "2025-07-22"
json_cache.write()
```
