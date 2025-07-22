# Система команд

Система регистрации команд ZwyLib позволяет удобно в пару строк регистрировать команды, сабкоманды и обработчики ошибок, а также "на лету" добавлять новые или убирать уже существующие.

## Начало работы

Давайте зарегистрируем самую простую команду:

```python
# ... метаданные и импорт zwylib ...

def register_commands():
    prefix = "!"  # префикс для всех команд вашего плагина
    commands_priority = 10  # приоритет ваших команд над другими

    # именно через диспатчер будет происходить регистрация всех команд
    dispatcher = zwylib.command_manager.get_dispatcher(__id__, prefix, commands_priority)

    # регистрируем команду "!test"
    @dispatcher.register_command("test")
    def test_command(params: Any, account: int) -> HookResult:
        # https://plugins.exteragram.app/docs/plugin-class#message-sending-hook

        params.message = "Команда '!test' выполнена успешно!"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

class MyPlugin(BasePlugin):
    def on_plugin_load(self):
        # регистрируем команды
        register_commands()

    def on_plugin_unload(self):
        # при выключении плагина нужно дерегистрировать команды
        # для избежания проблем при обновлении и валидации плагина
        zwylib.command_manager.remove_dispatcher(__id__)

    ...  # остальная логика плагина
```

Аргументы `params` и `account` обязательны, ZwyLib выбросит исключение `MissingRequiredArguments` при регистрации команды, в которой будут отсутствовать эти аргументы.
Также, ZwyLib требует, чтобы тип возвращаемого объекта был `HookResult`. Если в команде будет указан другой тип, ZwyLib не сможет зарегистрировать эту команду и выбросит исключение `InvalidTypeError`.

## Саб-команды

ZwyLib позволяет регистрировать сколько угодно саб-команд:

```python
# ... метаданные и импорт zwylib ...

def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(__id__, "!")

    # команда будет вызываться как "!test"
    @dispatcher.register_command("test")
    def test_command(params: Any, account: int) -> HookResult:
        ...

    # команда будет вызываться как "!test sub"
    @test_command.subcommand("sub")
    def test_subcommand(params: Any, account: int) -> HookResult:
        params.message = "Команда '!test sub' выполнена успешно!"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

    # команда будет вызываться как "!test sub new"
    @test_subcommand.subcommand("new")
    def test_sub_new_command(params: Any, account: int) -> HookResult:
        params.message = "Команда '!test sub new' выполнена успешно!"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

# ...
```

## Аргументы

ZwyLib автоматически считывает отправляемое сообщение и парсит аргументы.

Если в команде указаны дополнительные аргументы помимо требуемых (`param`, `account`) и к ним указаны типы (поддерживаются примитивные `str`, `int`, `float`, `bool`, и простые `Any`, `Union`, `Optional` из модуля [`typing`](https://docs.python.org/3/library/typing.html)), ZwyLib автоматически распарсит и приведет к требуемым типам все аргументы.

> Для успешного приведения агрумента к `bool` входное значение должно быть одним из `true`, `1`, `yes`, `on` для `True`, и `false`, `0`, `no`, `off` для `False`

При ошибке в приведении к типу будет выброшен `zwylib.CannotCastError`, а при несовпадении количества требуемых аргументов и полученных будет выброшен `zwylib.WrongArgumentAmountError`.

Пример автоприведения типов аргументов в команде:

```python
def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("number")
    def number_command(params: Any, account: int, number: int) -> HookResult:
        params.message = f"Тип параметра number - {type(number)}"  # <class 'int'>
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

Также поддерживаются множество аргументов `*args`:

```python
def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("number")
    def number_command(params: Any, account: int, number: int, *args) -> HookResult:
        params.message = f"number: {type(number)}, args: {args}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

## Перехват ошибок

Во время обработки срабатывания (саб)команды или во время исполнении кода в ее теле может произойти исключение, и его можно перехватить, зарегистрировав обработчик через декоратор `@command.register_error_handler`:

```python
def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("number")
    def number_command(params: Any, account: int, number: int) -> HookResult:
        params.message = f"number: {type(number)}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

    @number_command.register_error_handler
    def number_command_error_handler(params: Any, account: int, error: Exception) -> HookResult:
        params.message = f"Произошла ошибка в команде number: {error}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

Декоратор `@command.register_error_handler` требует, чтобы в функции были фиксированно 3 обязательных аргумента: `param`, `account`, `exception`. Иначе ZwyLib не сможет зарегистрировать обработчик.

Если во время срабатывания команды в ее теле случится исключение, которое не будет перехвачено ZwyLib автоматически отправит сообщение со стактрейсом в чат.

## Дерегистрация команд

Если возникнет необходимость дерегистрировать команду, вы всегда можете это сделать следующим образом:

```python
dispatcher = zwylib.command_manager.get_dispatcher(__id__)
dispatcher.unregister_command("my_command")
```

Дерегистрация также уберет все саб-команды, зарегистрированные на удаляемую команду.

## `zwylib.CommandManager`

```python
zwylib.command_manager: CommandManager
```

Класс, создаваемый при инициализации ZwyLib и управляющий всеми диспатчерами. Должен быть использован только для использования указанных методов и только из глобальной переменной `zwylib.command_manager`.

### Методы

#### `get_dispatcher`

```python
CommandManager.get_dispatcher(
    plugin_id: str,
    prefix="default",  # "."
    commands_priority=-1
) -> Dispatcher
```

Создает (если нужно) и возвращает `Dispatcher` для данного `plugin_id`.

##### Аргументы

* `plugin_id` (`str`): Айди плагина, для которого будет получен диспатчер.
* `prefix` (`str`): Префикс для всех команд указанного плагина. Значение `default` будет означать префикс по умолчанию `.`.
* `commands_priority` (`int`): Приоритет срабатывания диспатчера. Значение по умолчанию `-1`


##### Пример

```python
zwylib.command_manager.get_dispatcher("MyPluginID", "!", 10)
```

---

#### `remove_dispatcher`

```python
CommandManager.remove_dispatcher(plugin_id: str)
```

Убирает диспатчер для указанного плагина.

##### Аргументы

* `plugin_id` (`str`): Айди плагина, для которого будет убран диспатчер.

##### Пример

```python
zwylib.command_manager.remove_dispatcher(__id__)
```

## `zwylib.Dispatcher`

```python
zwylib.command_manager.get_dispatcher(__id__): Dispatcher
```

Класс, получаемый при вызове [`zwylib.command_manager.get_dispatcher`](/commands#get_dispatcher) и управляющий командами определенного плагина. Должен быть использован только для использования указанных методов и получен только вследствии вызова [`zwylib.command_manager.get_dispatcher`](/commands#get_dispatcher).

### Методы

#### `set_prefix`

```python
dispatcher.set_prefix(prefix: str)
```

Присваивает указанный префикс всем командам данного `plugin_id`.

##### Аргументы

* `prefix` (`str`): Префикс для всех команд указанного плагина.

##### Пример

```python
dispatcher.set_prefix("/")
```

---

#### `@dispatcher.register_command`

```python
@dispatcher.register_command(name: str)
```

Декоратор, регистрирующий команду. Аргументы `params` и `account` обязательны для регистрации команды. Требует `HookResult` как тип возвращаемого объекта.

##### Аргументы

* `name` (`str`): Название команды. Не должно быть пустым или содержать пробелы.

##### Выбрасывает

* `MissingRequiredArguments` если функция не имеет аргументов `param` и `account`.
* `InvalidTypeError` Если аргументы функции имеют любой тип кроме `str`, `int`, `float`, `bool`, `Any`, `Union` или `Optional`, или возвращаемый тип не является `HookResult`.

##### Пример

```python
@dispatcher.register_command("hello")
def test_command(params: Any, account: int) -> HookResult:
    params.message = "Hi!"
    return HookResult(strategy=HookStrategy.MODIFY, params=params)
```
