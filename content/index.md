# Введение

ZwyLib - это небольшой плагин-библиотека, которая изначально создавалась для личного использования в плагинах разработчика, но, впоследствии ставшей инструментом, которым могут пользоваться все желающие.

## Начало работы

Любые плагины, которые используют инструментарий ZwyLib сначала должны ее импортировать (предварительно ее нужно [установить](https://t.me/zwyPlugins/48)):

```python
from ui.bulletin import BulletinHelper
from client_utils import get_last_fragment
from base_plugin import BasePlugin

from org.telegram.messenger import R
from org.telegram.ui import ChatActivity

# __id__, __name__, ...

try:
    import zwylib  # импортируем библиотеку
except (ImportError, ModuleNotFoundError):
    # zwylib не найден. выведем сообщение с кнопкой для удобства установки
    BulletinHelper.show_with_button(
        f"Запуск плагина {__name__} без ZwyLib невозможен.",
        R.raw.chats_infotip,
        "Установить",
        lambda: get_last_fragment().presentFragment(ChatActivity.of(-2521243181, 48)),
    )
    raise Exception("Запуск без ZwyLib невозможен. Пожалуйста, установите ее.")

class MyPlugin(BasePlugin):
    ...  # логика вашего плагина
```
