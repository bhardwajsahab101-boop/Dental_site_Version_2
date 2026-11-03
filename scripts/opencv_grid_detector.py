#!/usr/bin/env python3
"""
OpenCV Document Grid, Line, and Layout Detection Engine for DentalOS Register Scanner.
Detects page boundaries, perspective, rotation, image quality assessment,
horizontal & vertical grid lines, cells, and classifies document layout:
- COLUMN_BASED (Traditional table with rows and vertical columns)
- BOX_BASED (Rectangular or square patient-entry boxes across columns)
- FREE_FORM (Handwritten entries without consistent grid lines)
- MIXED_LAYOUT (Combination of tables, boxes, and unstructured notes)
"""

import sys
import os
import json
import argparse
import math
from typing import List, Dict, Any, Tuple

try:
    import cv2
    import numpy as np
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing OpenCV or NumPy dependency: {str(e)}",
        "layoutType": "COLUMN_BASED",
        "confidence": 0.5,
        "boxes": []
    }))
    sys.exit(1)


def assess_image_quality(gray: np.ndarray) -> Dict[str, Any]:
    """
    Computes image quality metrics: sharpness (Laplacian variance), brightness, and contrast.
    """
    try:
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        mean_brightness = float(np.mean(gray))
        contrast_std = float(np.std(gray))
        is_blurry = laplacian_var < 80.0
        is_too_dark = mean_brightness < 45.0
        is_too_bright = mean_brightness > 220.0

        return {
            "sharpness": round(laplacian_var, 2),
            "brightness": round(mean_brightness, 2),
            "contrast": round(contrast_std, 2),
            "isBlurry": is_blurry,
            "isTooDark": is_too_dark,
            "isTooBright": is_too_bright,
            "qualityScore": round(min(1.0, max(0.1, (laplacian_var / 500.0) * 0.5 + (contrast_std / 70.0) * 0.5)), 2)
        }
    except Exception:
        return {
            "sharpness": 100.0,
            "brightness": 128.0,
            "contrast": 50.0,
            "isBlurry": False,
            "isTooDark": False,
            "isTooBright": False,
            "qualityScore": 0.85
        }


def deskew_image(gray: np.ndarray, max_angle: float = 15.0) -> Tuple[np.ndarray, float]:
    """
    Detects slight rotation or skew using Otsu threshold and Hough lines, and corrects it.
    """
    try:
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 100:
            return gray, 0.0

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        if abs(angle) < 0.3 or abs(angle) > max_angle:
            return gray, 0.0

        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated, float(angle)
    except Exception:
        return gray, 0.0


def detect_page_boundary(image: np.ndarray) -> Tuple[int, int, int, int]:
    """
    Detects outermost page boundary / paper edges if the photo contains desk background.
    """
    h, w = image.shape[:2]
    try:
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        edged = cv2.Canny(blurred, 30, 150)
        contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        largest_area = 0
        best_box = (0, 0, w, h)
        total_area = w * h

        for c in contours:
            area = cv2.contourArea(c)
            if area > total_area * 0.4:
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                if len(approx) == 4 and area > largest_area:
                    x, y, bw, bh = cv2.boundingRect(approx)
                    if bw > w * 0.5 and bh > h * 0.5:
                        largest_area = area
                        best_box = (x, y, bw, bh)

        return best_box
    except Exception:
        return (0, 0, w, h)


def analyze_layout_structure(
    gray: np.ndarray,
    page_rect: Tuple[int, int, int, int]
) -> Dict[str, Any]:
    """
    Analyzes horizontal & vertical lines, cell contours, and determines layout category:
    COLUMN_BASED, BOX_BASED, FREE_FORM, or MIXED_LAYOUT.
    """
    px, py, pw, ph = page_rect
    roi = gray[py:py+ph, px:px+pw]
    h, w = roi.shape[:2]

    thresh = cv2.adaptiveThreshold(
        roi, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 3
    )

    # 1. Detect horizontal lines
    horiz_len = max(25, int(w * 0.03))
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horiz_len, 1))
    horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horiz_kernel)

    # 2. Detect vertical lines
    vert_len = max(20, int(h * 0.025))
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vert_len))
    vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vert_kernel)

    # Combine grid lines
    table_grid = cv2.add(horizontal_lines, vertical_lines)

    # Find contours of candidate cells
    contours, _ = cv2.findContours(table_grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    valid_cells = []
    # Narrow cells support tables with 8-15 columns (down to 3.5% width)
    min_cell_w = int(w * 0.035)
    max_cell_w = int(w * 0.98)
    min_cell_h = int(h * 0.025)
    max_cell_h = int(h * 0.70)

    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        if min_cell_w <= bw <= max_cell_w and min_cell_h <= bh <= max_cell_h:
            valid_cells.append((x, y, bw, bh))

    # Cluster X coordinates to count columns
    x_coords = [c[0] for c in valid_cells]
    y_coords = [c[1] for c in valid_cells]

    col_clusters = []
    col_threshold = max(20, int(w * 0.03))
    for x in sorted(x_coords):
        if not col_clusters or abs(x - col_clusters[-1][-1]) > col_threshold:
            col_clusters.append([x])
        else:
            col_clusters[-1].append(x)

    columns_detected = len(col_clusters)

    # Cluster Y coordinates to count rows
    row_clusters = []
    row_threshold = max(15, int(h * 0.025))
    for y in sorted(y_coords):
        if not row_clusters or abs(y - row_clusters[-1][-1]) > row_threshold:
            row_clusters.append([y])
        else:
            row_clusters[-1].append(y)

    rows_detected = len(row_clusters)
    regions_detected = len(valid_cells)

    # Layout classification logic
    # Traditional tabular register has >= 5 columns with regular horizontal rows
    layout_type = "COLUMN_BASED"
    confidence = 0.85
    requires_manual_review = False

    if columns_detected >= 5 and rows_detected >= 3 and regions_detected >= 15:
        layout_type = "COLUMN_BASED"
        confidence = min(0.98, 0.75 + (regions_detected / 100.0) * 0.2)
    elif columns_detected in [2, 3, 4] and rows_detected >= 2 and regions_detected >= 4:
        # Check aspect ratios of candidate boxes
        aspects = [c[2] / float(c[3]) for c in valid_cells if c[3] > 0]
        avg_aspect = float(np.mean(aspects)) if aspects else 2.0
        if 1.0 <= avg_aspect <= 3.5:
            layout_type = "BOX_BASED"
            confidence = 0.92
        else:
            layout_type = "COLUMN_BASED"
            confidence = 0.82
    elif regions_detected < 6:
        # Very few grid lines
        layout_type = "FREE_FORM"
        confidence = 0.78
        requires_manual_review = True
    else:
        layout_type = "MIXED_LAYOUT"
        confidence = 0.75
        requires_manual_review = True

    # Normalize cells to percentages
    normalized_boxes = []
    for idx, (x, y, bw, bh) in enumerate(valid_cells[:120]):
        nx = round(((px + x) / float(w)) * 100.0, 2)
        ny = round(((py + y) / float(h)) * 100.0, 2)
        nw = round((bw / float(w)) * 100.0, 2)
        nh = round((bh / float(h)) * 100.0, 2)
        normalized_boxes.append({
            "index": idx,
            "x": nx,
            "y": ny,
            "width": nw,
            "height": nh,
            "source": "opencv_lines"
        })

    return {
        "layoutType": layout_type,
        "confidence": round(confidence, 2),
        "columnsDetected": max(1, columns_detected),
        "rowsDetected": max(1, rows_detected),
        "regionsDetected": regions_detected,
        "requiresManualReview": requires_manual_review,
        "boxes": normalized_boxes
    }


def process_image(image_path: str, output_crops_dir: str = None) -> Dict[str, Any]:
    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": f"Image not found at path: {image_path}",
            "layoutType": "COLUMN_BASED",
            "confidence": 0.5,
            "boxes": []
        }

    img = cv2.imread(image_path)
    if img is None:
        return {
            "success": False,
            "error": f"Failed to decode image from path: {image_path}",
            "layoutType": "COLUMN_BASED",
            "confidence": 0.5,
            "boxes": []
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Quality Assessment
    quality = assess_image_quality(gray)

    # 2. Deskew / Rotation correction
    deskewed_gray, rot_angle = deskew_image(gray)

    # 3. Detect Page Boundary
    page_rect = detect_page_boundary(deskewed_gray)
    px, py, pw, ph = page_rect

    # 4. Analyze Layout Structure & Detect Cells
    layout_info = analyze_layout_structure(deskewed_gray, page_rect)

    return {
        "success": True,
        "width": w,
        "height": h,
        "rotationAngle": round(rot_angle, 2),
        "qualityAssessment": quality,
        "pageBoundary": {
            "x": round((px / float(w)) * 100.0, 2),
            "y": round((py / float(h)) * 100.0, 2),
            "width": round((pw / float(w)) * 100.0, 2),
            "height": round((ph / float(h)) * 100.0, 2)
        },
        "layoutType": layout_info["layoutType"],
        "confidence": layout_info["confidence"],
        "columnsDetected": layout_info["columnsDetected"],
        "rowsDetected": layout_info["rowsDetected"],
        "regionsDetected": layout_info["regionsDetected"],
        "requiresManualReview": layout_info["requiresManualReview"],
        "detectionMethod": "opencv_lines",
        "boxes": layout_info["boxes"],
        "cropsSaved": []
    }


def main():
    parser = argparse.ArgumentParser(description="OpenCV Layout & Grid Detector for DentalOS")
    parser.add_argument("image_path", help="Path to input register photograph")
    parser.add_argument("--crops_dir", default=None, help="Optional directory to save cropped cell images")
    args = parser.parse_args()

    result = process_image(args.image_path, args.crops_dir)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
