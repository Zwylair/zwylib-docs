# Utilities

## Logging and Notifications

To simplify and standardize logging and notification behavior, ZwyLib provides helper utilities: `build_log` and `build_bulletin_helper`.

### `zwylib.build_log`

```python
zwylib.build_log(
    plugin_name: str,
    level = logging.INFO
) -> logging.Logger
```

Creates a [`logging.Logger`](https://docs.python.org/3/library/logging.html) instance with the given prefix and logging level. Automatically includes the plugin prefix and the caller function name in every log message.

#### Arguments

* `plugin_name` (`str`): Plugin name, used as prefix in logs.
* `level` (`int`, optional): Logging level (e.g., `DEBUG`, `INFO`). Default is `logging.INFO`.

#### Returns

* [`logging.Logger`](https://docs.python.org/3/library/logging.html): Logger instance for structured logging.

#### Example

```python
logger = zwylib.build_log("MyPluginLogger")

# ...

class MyPlugin(BasePlugin):
    def on_plugin_unload(self):
        logger.error("Execution failed", "code 42")
        # [MyPluginLogger] [on_plugin_unload] Execution failed code 42
```

---

### `zwylib.build_bulletin_helper`

```python
zwylib.build_bulletin_helper(
    prefix: str
) -> BulletinHelper
```

Factory function that creates an extended [`BulletinHelper`](https://plugins.exteragram.app/docs/client-utils#displaying-bulletins-bottom-notifications) class, automatically prefixing all messages with the provided plugin name.

#### Arguments

* `prefix` (`str`): Prefix to be prepended to all bulletin messages (usually the plugin name).

#### Returns

* `BulletinHelper`: Extended class with prefixed notification methods.

#### Example

```python
bulletins = zwylib.build_bulletin_helper("MyPlugin")
bulletins.show_info("something happened")
```

## Helper Classes

### `zwylib.SingletonMeta`

```python
class SingletonMeta(type)
```

Metaclass implementing the [singleton pattern](https://refactoring.guru/design-patterns/singleton/python/example). Use it as the metaclass for any class that must have only one instance.

#### Example

```python
class MyManager(metaclass=SingletonMeta):
    ...

a = MyManager()
b = MyManager()

assert a is b  # True
```

---

### `zwylib.Callback1`

```python
zwylib.Callback1(func: (Any) -> None)
```

Wrapper class allowing a Python function to be passed into Java code via Chaquopy, emulating the [`Utilities.Callback`](https://github.com/DrKLO/Telegram/blob/master/TMessagesProj/src/main/java/org/telegram/messenger/Utilities.java#L519) Java interface.

#### Constructor Arguments

* `fn` (`Callable[[Any], None]`): A Python function that accepts a single argument and returns nothing. Called from Java via `.run(...)`.

#### Methods

##### `run`

```python
Callback1.run(arg: Any) -> None
```

Called from Java, forwards the provided argument to the Python function. Exceptions are logged internally and not raised.

#### Example

```python
def my_python_callback(value):
    print(f"Received from Java: {value}")

callback = Callback1(my_python_callback)
some_java_object.setCallback(callback)
```

## Helper Functions

### `zwylib.is_zwylib_version_sufficient`

```python
def is_zwylib_version_sufficient(
    plugin_name: str,
    version: str,
    show_bulletin = True
) -> bool
```

Checks whether the current ZwyLib version is greater than or equal to the required `version`.

If the version is insufficient and `show_bulletin` is `True`, a bulletin is shown with a button allowing the user to navigate to the update.

#### Arguments

* `plugin_name` (`str`): Plugin name shown in the bulletin.
* `version` (`str`): Minimum required ZwyLib version.
* `show_bulletin` (`bool`, default `True`): Whether to show a bulletin on version mismatch.

#### Returns

* `bool`: `True` if current ZwyLib version is sufficient, `False` otherwise.

#### Example

```python
zwylib.is_zwylib_version_sufficient("MyPlugin", "1.2.0")
```

---

### `zwylib.get_message`

```python
zwylib.get_message(
    chat_id: int,
    message_id: int,
    callback: (TLRPC.TL_message | TLRPC.TL_messageEmpty | None) -> None
)
```

Asynchronously triggers a message reload from server, then fetches the message from local storage and passes it to the `callback` once available.

#### Arguments

* `chat_id` (`int`): ID of the chat containing the message.
* `message_id` (`int`): ID of the message.
* `callback` (`Callable`): Function called with the message (or `None`) when found.

#### Example

```python
def handle_msg(msg):
    if msg:
        print("Received message:", msg.message)
    else:
        print("Message not found")

zwylib.get_message(chat_id=12345, message_id=67890, callback=handle_msg)
```
