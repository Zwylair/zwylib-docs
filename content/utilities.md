# Утилиты

## Логгирование и уведомления

Для удобства и стандартизации вывода логов и всплывающих уведомлений ZwyLib предоставляет вспомогательные утилиты: `build_log` и `build_bulletin_helper`.

### `zwylib.build_log`

```python
zwylib.build_log(
    plugin_name: str,
    level = logging.INFO
) -> logging.Logger
```

Создаёт логгер [`logging.Logger`](https://docs.python.org/3/library/logging.html) с указанным префикса и уровнем логирования. Автоматически добавляет в выводимое сообщение указанный префикс и название функции, в которой произведен вызов.

#### Аргументы

* `plugin_name` (`str`): имя плагина, префикс, будет отображаться в логах.
* `level` (`int`, опционально): уровень логирования. По умолчанию `logging.INFO`.

#### Возвращает

* [`logging.Logger`](https://docs.python.org/3/library/logging.html) — экземпляр логгера, через который можно логировать информацию.

#### Пример

```python
logger = zwylib.build_log("MyPluginLogger")

# ...

class MyPlugin(BasePlugin):
	def on_plugin_unload(self):
		logger.error("Ошибка при выполнении", "код 42")
		# [MyPluginLogger] [on_plugin_unload] Ошибка при выполнении код 42
```

---

### `zwylib.build_bulletin_helper`

```python
zwylib.build_bulletin_helper(
    plugin_name: str,
    level = logging.INFO
) -> logging.Logger
```

Фабрика, создающая расширенный класс [`BulletinHelper`](https://plugins.exteragram.app/docs/client-utils#displaying-bulletins-bottom-notifications), который автоматически добавляет указанный префикс во все Bulletin уведомления (информационные, ошибки, успех).

#### Аргументы

* `prefix` (`str`): префикс, который будет автоматически подставляться к каждому сообщению (обычно имя плагина).

#### Возвращает

* [`BulletinHelper`](https://plugins.exteragram.app/docs/client-utils#displaying-bulletins-bottom-notifications): расширенный класс с выводом префикса в уведомлениях.

#### Пример

```python
bulletins = zwylib.build_bulletin_helper("MyPlugin")
bulletins.show_info("что-то случилось")
```

## Вспомогательные классы

### `zwylib.SingletonMeta`

```python
class SingletonMeta(type)
```

Метакласс для реализации [паттерна синглтон](https://refactoring.guru/design-patterns/singleton/python/example). Используется как метакласс при определении любого класса, который должен иметь единственный экземпляр.

При создании нового экземпляра класса с этим метаклассом, будет возвращён уже существующий, если он ранее создавался.

#### Пример:

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

Класс-обёртка, позволяющий передавать Python-функции в Java-код, имитируя интерфейс [`Utilities.Callback`](https://github.com/DrKLO/Telegram/blob/master/TMessagesProj/src/main/java/org/telegram/messenger/Utilities.java#L519).

#### Аргументы конструктора

* `fn` (`Callable[[Any], None]`): Python-функция, принимающая один аргумент любого типа и ничего не возвращающая, которая будет вызвана при вызове `.run(...)` из Java-кода.

#### Методы

##### `run`

```python
Callback1.run(arg: Any) -> None
```

Метод, вызываемый со стороны Java-кода, пробрасывающий переданный аргумент в обёрнутую Python-функцию.

Автоматически логирует исключения, возникшие при вызове, без их выбрасывания.

#### Пример

```python
def my_python_callback(value):
    print(f"Получено из Java: {value}")

callback = Callback1(my_python_callback)
some_java_object.setCallback(callback)
```

## Вспомогательные функции

### `zwylib.is_zwylib_version_sufficient`

```python
def is_zwylib_version_sufficient(
    plugin_name: str,
    version: str,
    show_bulletin = True
) -> bool
```

Проверяет, соответствует ли текущая версия ZwyLib требуемой, указанной в `version`.

Если версия недостаточна, и флаг `show_bulletin` установлен в `True`, пользователю будет показано всплывающее уведомление с кнопкой обновления на актуальную версию.

#### Аргументы

* `plugin_name` (`str`): Название плагина, которое будет выведено в сплывающем сообщении.
* `version` (`str`): Минимально допустимая версия ZwyLib.
* `show_bulletin` (`bool`, по умолчанию `True`): Нужно ли показывать уведомление при недостаточной версии.

#### Возвращает

* `bool`: `True`, если текущая версия ZwyLib достаточна, `False` иначе.

#### Пример

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

Асинхронно заставляет приложение получить сообщение из сервера, после чего извлекает его из локального хранилища и передаёт его в `callback`, когда сообщение появится.

#### Аргументы

* `chat_id` (`int`): ID чата, в котором находится сообщение.
* `message_id` (`int`): ID нужного сообщения.
* `callback` (`Callable`): Функция, которая будет вызвана с найденным сообщением как аргумент. Получает объект `TL_message`, `TL_messageEmpty` или `None`.

#### Пример

```python
def handle_msg(msg):
    if msg:
        print("Получено сообщение:", msg.message)
    else:
        print("Сообщение не найдено")

zwylib.get_message(chat_id=12345, message_id=67890, callback=handle_msg)
```
