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

If a command function includes additional typed parameters beyond the required `params` and `account`, ZwyLib will try to parse and cast arguments to the expected types. Supported types include: `str`, `int`, `float`, `bool`, and generic `Any`, `Union`, `Optional` from [`typing`](https://docs.python.org/3/library/typing.html).

> For correct boolean conversion, values like `true`, `1`, `yes`, `on` map to `True`, and `false`, `0`, `no`, `off` map to `False`.

If casting fails, a `CannotCastError` is thrown. If the number of provided arguments doesn’t match the function’s signature, a `WrongArgumentAmountError` is raised.

Example:

```python
def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("number")
    def number_command(params: Any, account: int, number: int) -> HookResult:
        params.message = f"Parameter type of 'number' is {type(number)}"  # <class 'int'>
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

Also supports variadic arguments (`*args`):

```python
def register_commands():
    dispatcher = zwylib.command_manager.get_dispatcher(...)

    @dispatcher.register_command("number")
    def number_command(params: Any, account: int, number: int, *args) -> HookResult:
        params.message = f"number: {type(number)}, args: {args}"
        return HookResult(strategy=HookStrategy.MODIFY_FINAL, params=params)
```

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
