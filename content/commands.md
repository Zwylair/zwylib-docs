# Command System

The ZwyLib command registration system allows you to easily register commands, subcommands, and error handlers in just a few lines — and also dynamically add or remove them at runtime.

## Getting Started

Let’s register a basic command:

```python
# ... metadata and zwylib import ...

def register_commands():
    prefix = "!"  # command prefix for your plugin
    commands_priority = 10  # your commands' execution priority over others

    # commands are registered through a dispatcher
    dispatcher = zwylib.command_manager.get_dispatcher(__id__, prefix, commands_priority)

    # register the "!test" command
    @dispatcher.register_command("test")
    def test_command(params: Any, account: int) -> HookResult:
        # https://plugins.exteragram.app/docs/plugin-class#message-sending-hook

        params.message = "Command '!test' executed successfully!"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

class MyPlugin(BasePlugin):
    def on_plugin_load(self):
        # register commands when the plugin loads
        register_commands()

    def on_plugin_unload(self):
        # on unload, deregister commands to avoid issues with plugin updates/validation
        zwylib.command_manager.remove_dispatcher(__id__)

    ...  # rest of plugin logic
````

The arguments `params` and `account` are **mandatory** — ZwyLib will raise a `MissingRequiredArguments` error if these are missing.

ZwyLib also enforces the return type to be `HookResult`. If a different type is returned, an `InvalidTypeError` will be thrown and the command won't be registered.

## Subcommands

ZwyLib allows you to register as many nested subcommands as you like:

```python
# ... metadata and zwylib import ...

def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(__id__, "!")

    # called as "!test"
    @dispatcher.register_command("test")
    def test_command(params: Any, account: int) -> HookResult:
        ...

    # called as "!test sub"
    @test_command.subcommand("sub")
    def test_subcommand(params: Any, account: int) -> HookResult:
        params.message = "Command '!test sub' executed successfully!"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

    # called as "!test sub new"
    @test_subcommand.subcommand("new")
    def test_sub_new_command(params: Any, account: int) -> HookResult:
        params.message = "Command '!test sub new' executed successfully!"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

## Arguments

ZwyLib automatically parses the message text and attempts to match parameters based on function arguments.

The function must have required `params` and `account` parameters and if a command function includes additional typed parameters, ZwyLib will try to parse and cast arguments to the expected types. Supported types include: `str`, `int`, `float`, `bool`, and generic `Any`, `Union`, `Optional` from the `typing` module (see [Python typing documentation](https://docs.python.org/3/library/typing.html)).

> **Note**: For boolean conversion, values like `true`, `1`, `yes`, `on` map to `True`, and `false`, `0`, `no`, `off` map to `False`.

If casting fails, a `CannotCastError` is raised. If the number of provided arguments is less than the required (non-Optional, non-default, non-variadic) arguments or more than the expected arguments (when no variadic arguments are present), a `WrongArgumentAmountError` is raised. Arguments annotated as `Optional[T]` (or `Union[T, None]`) or with a default value (e.g., `arg: str = None`) are automatically assigned `None` or their default value if no value is provided.

ZwyLib also supports variadic arguments (`*args`), which must be annotated as `*args: T`, where `T` is one of the supported types (`str`, `int`, `float`, `bool`, `Any`, or a `Union` of these types). Variadic arguments are passed as a tuple to the command function:
- If no extra arguments are provided, `*args` is an empty tuple `()`.
- If one extra argument is provided, `*args` is a single-item tuple `(arg,)`.
- If multiple extra arguments are provided, `*args` is a tuple of all extra arguments `(arg1, arg2, ...)`.

### Examples

#### Example 1: Required and Variadic Arguments

```python
from typing import Union

def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("numbers")
    def numbers_command(params: Any, account: int, first: int, *args: int) -> HookResult:
        params.message = f"First: {first}, additional numbers: {args}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

- `!numbers 42` → `first = 42`, `args = ()` → Output: `First: 42, additional numbers: ()`
- `!numbers 42 100` → `first = 42`, `args = (100,)` → Output: `First: 42, additional numbers: (100,)`
- `!numbers 42 100 200 300` → `first = 42`, `args = (100, 200, 300)` → Output: `First: 42, additional numbers: (100, 200, 300)`
- `!numbers` → Error: `Expected at least 3 arguments, got 2`

#### Example 2: Optional Argument

```python
from typing import Optional

def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("test")
    def test_command(params: Any, account: int, option: Optional[str]) -> HookResult:
        params.message = f"Option: {option}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

- `!test hello 123` → `account = 123`, `option = None` → Output: `Option: None`
- `!test hello 123 abc` → `account = 123`, `option = "abc"` → Output: `Option: abc`
- `!test hello` → Error: `Expected at least 2 arguments, got 1`
- `!test hello 123 abc def` → Error: `Expected at most 3 arguments, got 4`

#### Example 3: Optional Argument with Default Value

```python
from typing import Optional

def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("test")
    def test_command(params: Any, account: int, option: Optional[str] = None) -> HookResult:
        params.message = f"Option: {option}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

- `!test hello 123` → `account = 123`, `option = None` → Output: `Option: None`
- `!test hello 123 abc` → `account = 123`, `option = "abc"` → Output: `Option: abc`
- `!test hello` → Error: `Expected at least 2 arguments, got 1`
- `!test hello 123 abc def` → Error: `Expected at most 3 arguments, got 4`

#### Example 4: Only Variadic Arguments

```python
from typing import Union

def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("echo")
    def echo_command(params: Any, account: int, *args: Union[str, int]) -> HookResult:
        params.message = f"Echo: {list(args)}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

- `!echo` → `args = ()` → Output: `Echo: []`
- `!echo hello` → `args = ('hello',)` → Output: `Echo: ['hello']`
- `!echo hello 42` → `args = ('hello', 42)` → Output: `Echo: ['hello', 42]`

If the `*args` parameter's type or any argument type is not one of the supported types or a valid `Union`/`Optional` of supported types, an `InvalidTypeError` is raised during command registration.


## Error Handling

If an exception occurs during command or subcommand execution, it can be caught using the `@command.register_error_handler` decorator:

```python
def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("number")
    def number_command(params: Any, account: int, number: int) -> HookResult:
        params.message = f"number: {type(number)}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)

    @number_command.register_error_handler
    def number_command_error_handler(params: Any, account: int, error: Exception) -> HookResult:
        params.message = f"An error occurred in 'number': {error}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

The error handler **must** accept exactly three arguments: `params`, `account`, and `error`. Otherwise, ZwyLib won’t register the handler.

Unhandled exceptions in a command will cause ZwyLib to send the stack trace to chat.

## Command Deregistration

To manually remove a command, use:

```python
dispatcher = zwylib.command_manager.get_dispatcher(__id__)
dispatcher.unregister_command("my_command")
```

This will also remove all subcommands associated with the removed command.

## `zwylib.CommandManager`

```python
zwylib.command_manager: CommandManager
```

This global object is created during ZwyLib initialization and is used to manage all dispatchers. You should only use its documented methods.

### Methods

#### `get_dispatcher`

```python
CommandManager.get_dispatcher(
    plugin_id: str,
    prefix="default",  # defaults to "."
    commands_priority=-1
) -> Dispatcher
```

Creates (if necessary) and returns a `Dispatcher` instance for the given `plugin_id`.

##### Parameters

* `plugin_id` (`str`): Your plugin’s unique ID.
* `prefix` (`str`): Prefix for all commands of this plugin. `"default"` means `"."`.
* `commands_priority` (`int`): Execution priority. Default is `-1`.

##### Example

```python
zwylib.command_manager.get_dispatcher("MyPluginID", "!", 10)
```

---

#### `remove_dispatcher`

```python
CommandManager.remove_dispatcher(plugin_id: str)
```

Removes the dispatcher associated with the given plugin.

##### Parameters

* `plugin_id` (`str`): ID of the plugin whose dispatcher is being removed.

##### Example

```python
zwylib.command_manager.remove_dispatcher(__id__)
```

## `zwylib.Dispatcher`

```python
zwylib.command_manager.get_dispatcher(__id__): Dispatcher
```

A class returned by [`zwylib.command_manager.get_dispatcher`](/commands#get_dispatcher), responsible for registering commands under the current plugin ID. Should only be obtained via `get_dispatcher`.

### Methods

#### `set_prefix`

```python
dispatcher.set_prefix(prefix: str)
```

Sets the prefix for all commands registered via this dispatcher.

##### Parameters

* `prefix` (`str`): New command prefix.

##### Example

```python
dispatcher.set_prefix("/")
```

---

#### `@dispatcher.register_command`

```python
@dispatcher.register_command(name: str)
```

Decorator to register a command.

Arguments `params` and `account` are required. The return type must be `HookResult`.

##### Parameters

* `name` (`str`): Command name. Cannot be empty or contain spaces.

##### Raises

* `MissingRequiredArguments`: If `params` or `account` are missing.
* `InvalidTypeError`: If parameter types are unsupported or return type is not `HookResult`.

##### Example

```python
@dispatcher.register_command("hello")
def test_command(params: Any, account: int) -> HookResult:
    params.message = "Hi!"
    return HookResult(strategy=HookStrategy.MODIFY, params=params)
```
