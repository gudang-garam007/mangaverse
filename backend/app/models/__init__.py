# backend/app/models/__init__.py
from .base import Base
from .character import Character
from .manga import Manga  # <--- Ye line missing thi! (File name check kar lena)

# Agar koi aur model hai (jaise Weapon, User), toh unko bhi yahan import kar de
# from .weapon import Weapon