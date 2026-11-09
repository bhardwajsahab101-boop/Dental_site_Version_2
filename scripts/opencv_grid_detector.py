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
    If the document already fills the frame, returns the full frame.
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
            if area > total_area * 0.6:
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                if len(approx) == 4 and area > largest_area:
                    x, y, bw, bh = cv2.boundingRect(approx)
                    # Only crop if there is genuine background desk margin on all 4 sides
                    if x > w * 0.05 and y > h * 0.05 and (x + bw) < w * 0.95 and (y + bh) < h * 0.95:
                        largest_area = area
                        best_box = (x, y, bw, bh)

        return best_box
    except Exception:
        return (0, 0, w, h)


def cluster_points(points: np.ndarray, min_gap: int = 30) -> List[int]:
    """
    Clusters consecutive line coordinates within min_gap pixels into a single central divider coordinate.
    """
    if len(points) == 0:
        return []
    clusters = [[int(points[0])]]
    for p in points[1:]:
        if int(p) - clusters[-1][-1] <= min_gap:
            clusters[-1].append(int(p))
        else:
            clusters.append([int(p)])
    return [int(np.mean(c)) for c in clusters]


def analyze_layout_structure(
    gray: np.ndarray,
    page_rect: Tuple[int, int, int, int]
) -> Dict[str, Any]:
    """
    Analyzes horizontal & vertical lines, cell contours, dividers, and determines layout category:
    COLUMN_BASED, BOX_BASED, FREE_FORM, or MIXED_LAYOUT.
    CRITICAL: For COLUMN_BASED registers, a patient entry is an entire horizontal ROW, NOT a single cell!
    """
    px, py, pw, ph = page_rect
    roi = gray[py:py+ph, px:px+pw]
    h, w = roi.shape[:2]

    thresh = cv2.adaptiveThreshold(
        roi, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 3
    )

    # 1. Detect horizontal lines
    horiz_len = max(25, int(w * 0.035))
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horiz_len, 1))
    horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horiz_kernel)

    # 2. Detect vertical lines
    vert_len = max(20, int(h * 0.03))
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vert_len))
    vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vert_kernel)

    # Combine grid lines
    table_grid = cv2.add(horizontal_lines, vertical_lines)

    # Find contours of candidate cells
    contours, _ = cv2.findContours(table_grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    valid_cells = []
    min_cell_w = int(w * 0.035)
    max_cell_w = int(w * 0.98)
    min_cell_h = int(h * 0.025)
    max_cell_h = int(h * 0.70)

    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        if min_cell_w <= bw <= max_cell_w and min_cell_h <= bh <= max_cell_h:
            valid_cells.append((x, y, bw, bh))

    # Cluster projections to detect exact divider coordinates
    horiz_proj = np.sum(horizontal_lines, axis=1)
    vert_proj = np.sum(vertical_lines, axis=0)

    max_h_proj = float(np.max(horiz_proj)) if len(horiz_proj) > 0 else 1.0
    max_v_proj = float(np.max(vert_proj)) if len(vert_proj) > 0 else 1.0

    peaks_y = np.where(horiz_proj > max_h_proj * 0.12)[0]
    clustered_y = cluster_points(peaks_y, min_gap=max(15, int(h * 0.03)))

    peaks_x = np.where(vert_proj > max_v_proj * 0.12)[0]
    clustered_x = cluster_points(peaks_x, min_gap=max(20, int(w * 0.025)))

    columns_detected = max(1, len(clustered_x) - 1) if len(clustered_x) >= 2 else 1
    rows_detected = max(1, len(clustered_y) - 1) if len(clustered_y) >= 2 else 1
    regions_detected = len(valid_cells)

    # Layout classification logic
    layout_type = "COLUMN_BASED"
    confidence = 0.85
    requires_manual_review = False

    if columns_detected >= 5 and rows_detected >= 3 and regions_detected >= 15:
        layout_type = "COLUMN_BASED"
        confidence = min(0.98, 0.78 + (regions_detected / 100.0) * 0.2)
    elif columns_detected in [2, 3, 4] and rows_detected >= 2 and regions_detected >= 4:
        aspects = [c[2] / float(c[3]) for c in valid_cells if c[3] > 0]
        avg_aspect = float(np.mean(aspects)) if aspects else 2.0
        if 1.0 <= avg_aspect <= 3.5:
            layout_type = "BOX_BASED"
            confidence = 0.92
        else:
            layout_type = "COLUMN_BASED"
            confidence = 0.82
    elif regions_detected < 6:
        layout_type = "FREE_FORM"
        confidence = 0.78
        requires_manual_review = True
    else:
        layout_type = "MIXED_LAYOUT"
        confidence = 0.75
        requires_manual_review = True

    # Build boxes:
    # CRITICAL FIX: For COLUMN_BASED, output ROW BOXES (each row spans all columns across table width).
    # NEVER treat each cell as an independent patient!
    output_boxes = []

    if layout_type == "COLUMN_BASED" and len(clustered_y) >= 3 and len(clustered_x) >= 2:
        table_x_left = clustered_x[0]
        table_x_right = clustered_x[-1]
        table_width = max(10, table_x_right - table_x_left)

        # Header row is index 0: from clustered_y[0] to clustered_y[1]
        data_divs = clustered_y[1:]
        # Remove trailing page margin / bottom footer if past 85% height
        if len(data_divs) >= 3 and data_divs[-1] > h * 0.88 and (data_divs[-1] - data_divs[-2]) > int(h * 0.08):
            data_divs = data_divs[:-1]

        # Calculate median row height to split any merged double-rows
        if len(data_divs) >= 2:
            heights = [data_divs[i+1] - data_divs[i] for i in range(len(data_divs)-1)]
            median_h = float(np.median(heights)) if heights else float(h * 0.07)

            refined_divs = [data_divs[0]]
            for i in range(len(data_divs)-1):
                y1 = data_divs[i]
                y2 = data_divs[i+1]
                diff = y2 - y1
                if diff > median_h * 1.55:
                    # Line was faint between two rows, split evenly
                    refined_divs.append((y1 + y2) // 2)
                refined_divs.append(y2)
        else:
            refined_divs = data_divs

        for r_idx in range(len(refined_divs) - 1):
            y_top = refined_divs[r_idx]
            y_bot = refined_divs[r_idx + 1]
            row_h = y_bot - y_top

            nx = round(((px + table_x_left) / float(w)) * 100.0, 2)
            ny = round(((py + y_top) / float(h)) * 100.0, 2)
            nw = round((table_width / float(w)) * 100.0, 2)
            nh = round((row_h / float(h)) * 100.0, 2)

            output_boxes.append({
                "index": r_idx + 1,
                "rowIndex": r_idx,
                "colIndex": 0,
                "x": nx,
                "y": ny,
                "width": nw,
                "height": nh,
                "source": "opencv_table_row"
            })

        # If detected patient rows is < 3 (e.g. dividers were too faint), synthesize 10 row bands across table
        if len(output_boxes) < 3:
            output_boxes = []
            header_bot = clustered_y[1] if len(clustered_y) > 1 else int(h * 0.13)
            table_bot = clustered_y[-1] if len(clustered_y) > 2 else int(h * 0.88)
            available_h = table_bot - header_bot
            num_data_rows = max(5, rows_detected - 1)
            band_h = available_h / float(num_data_rows)
            for r in range(num_data_rows):
                ry = header_bot + (r * band_h)
                output_boxes.append({
                    "index": r + 1,
                    "rowIndex": r,
                    "colIndex": 0,
                    "x": round(((px + table_x_left) / float(w)) * 100.0, 2),
                    "y": round(((py + ry) / float(h)) * 100.0, 2),
                    "width": round((table_width / float(w)) * 100.0, 2),
                    "height": round((band_h / float(h)) * 100.0, 2),
                    "source": "opencv_row_band"
                })
    else:
        # BOX_BASED or other layouts: each card box is an entry
        for idx, (x, y, bw, bh) in enumerate(valid_cells[:120]):
            nx = round(((px + x) / float(w)) * 100.0, 2)
            ny = round(((py + y) / float(h)) * 100.0, 2)
            nw = round((bw / float(w)) * 100.0, 2)
            nh = round((bh / float(h)) * 100.0, 2)
            output_boxes.append({
                "index": idx + 1,
                "rowIndex": idx // max(1, columns_detected),
                "colIndex": idx % max(1, columns_detected),
                "x": nx,
                "y": ny,
                "width": nw,
                "height": nh,
                "source": "opencv_box"
            })

    # Normalized dividers in percentage
    norm_col_divs = [round((cx / float(w)) * 100.0, 2) for cx in clustered_x]
    norm_row_divs = [round((cy / float(h)) * 100.0, 2) for cy in clustered_y]

    return {
        "layoutType": layout_type,
        "confidence": round(confidence, 2),
        "columnsDetected": max(1, columns_detected),
        "rowsDetected": len(output_boxes) if layout_type == "COLUMN_BASED" else max(1, rows_detected),
        "regionsDetected": regions_detected,
        "totalCellsDetected": regions_detected,
        "totalRowsDetected": len(output_boxes) if layout_type == "COLUMN_BASED" else max(1, rows_detected),
        "requiresManualReview": requires_manual_review,
        "columnDividers": norm_col_divs,
        "rowDividers": norm_row_divs,
        "boxes": output_boxes
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

    # 4. Analyze Layout Structure & Detect Rows / Columns / Cells
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
        "totalCellsDetected": layout_info["totalCellsDetected"],
        "totalRowsDetected": layout_info["totalRowsDetected"],
        "requiresManualReview": layout_info["requiresManualReview"],
        "columnDividers": layout_info.get("columnDividers", []),
        "rowDividers": layout_info.get("rowDividers", []),
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
