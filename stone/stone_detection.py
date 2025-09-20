import os
import cv2
import numpy as np
import pandas as pd
import seaborn as sns
from tqdm import tqdm
from zipfile import ZipFile
import matplotlib.pyplot as plt
from PIL import Image
from ultralytics import YOLO

model_weights_path = '/Users/sankrut/Projects/Stone2/content/runs/detect/train2/weights/best.pt'
stone_detection_model = YOLO(model_weights_path)
test_image_path = '/Users/sankrut/Projects/Stone2/content/data/test/images/1-3-46-670589-33-1-63713387527442829100001-4953850576413253802_png_jpg.rf.3c687e765595c73826990914236c246c.jpg'
img_arr = Image.open(test_image_path)
results = stone_detection_model.predict(source = img_arr, save = True)

h, w = results[0].orig_shape  # image shape


#diameter_prediction
for box in results[0].boxes:
    x1, y1, x2, y2 = box.xyxy[0]   # bounding box corners

    # Width and height of bounding box
    width  = (x2 - x1).item()
    height = (y2 - y1).item()

    # Approximate diameter of stone
    diameter = max(width, height)

    print(f"Stone detected at [{x1:.2f}, {y1:.2f}, {x2:.2f}, {y2:.2f}]")
    print(f"Width: {width:.2f} px, Height: {height:.2f} px")
    print(f"Estimated diameter: {diameter:.2f} px")

    pixel_to_mm = 0.5  # example scaling, depends on scan
    diameter_mm = diameter * pixel_to_mm
    print(f"Estimated diameter: {diameter_mm:.2f} mm")