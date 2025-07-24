# Auto-update

ZwyLib provides plugin developers with the ability to enable auto-updating for their plugins. However, the timeout between update checks is controlled only in the ZwyLib plugin settings. To enable auto-update for your plugin, you need to:

1. Make a post in any public channel containing the plugin file that ZwyLib will download;
2. Add a task to the ZwyLib auto-updater:

```python
# ... metadata and zwylib import ...

class MyPlugin(BasePlugin):
    def on_plugin_load(self):
        update_channel_id = 123456789  # ID of the channel where the post is located
        update_message_id = 11  # ID of the message with the plugin file

        # add the task
        zwylib.add_autoupdater_task(__id__, update_channel_id, update_message_id)

        ...  # other plugin logic
```

Also, if you want to make auto-update optional, or you simply need to remove the task at some point, you can use the `remove_autoupdater_task` method:

```python
zwylib.remove_autoupdater_task(__id__)
```
