#!/usr/bin/env python3
"""
OpenCV Document Grid and Box Detection Engine for DentalOS Register Scanner.
Detects page boundaries, grid lines, columns, reading order, and patient-entry box coordinates.
Can be executed as a standalone CLI tool or invoked as a child process by Next.js.
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
        "boxes": []
    }))
    sys.exit(1)


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

        # If angle is negligible or too extreme, skip rotation
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
                    # Must be a reasonable rectangle
                    if bw > w * 0.5 and bh > h * 0.5:
                        largest_area = area
                        best_box = (x, y, bw, bh)

        return best_box
    except Exception:
        return (0, 0, w, h)


def detect_grid_boxes(
    gray: np.ndarray,
    page_rect: Tuple[int, int, int, int],
    expected_cols: int = 0,
    reading_order: str = "column_first"
) -> Dict[str, Any]:
    """
    Extracts grid lines and detects individual patient entry box contours.
    """
    px, py, pw, ph = page_rect
    roi = gray[py:py+ph, px:px+pw]
    h, w = roi.shape[:2]

    # Adaptive thresholding for line extraction
    thresh = cv2.adaptiveThreshold(
        roi, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 3
    )

    # 1. Detect horizontal lines
    horiz_kernel_len = max(20, int(w * 0.04))
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horiz_kernel_len, 1))
    horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horiz_kernel)

    # 2. Detect vertical lines
    vert_kernel_len = max(20, int(h * 0.03))
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vert_kernel_len))
    vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vert_kernel)

    # 3. Combine grid lines
    table_grid = cv2.add(horizontal_lines, vertical_lines)

    # Find contours of candidate cells
    contours, _ = cv2.findContours(table_grid, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    valid_cells = []
    min_cell_w = int(w * 0.12)  # at least 12% width
    max_cell_w = int(w * 0.95)
    min_cell_h = int(h * 0.04)  # at least 4% height
    max_cell_h = int(h * 0.60)

    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        if min_cell_w <= bw <= max_cell_w and min_cell_h <= bh <= max_cell_h:
            # Check aspect ratio
            aspect = bw / float(bh)
            if 0.5 <= aspect <= 5.0:
                valid_cells.append((x, y, bw, bh))

    # Remove heavily overlapping duplicates
    filtered_cells = []
    valid_cells.sort(key=lambda b: (b[0], b[1]))
    for cell in valid_cells:
        x, y, bw, bh = cell
        is_dup = False
        for fx, fy, fbw, fbh in filtered_cells:
            # Check intersection over union
            inter_x = max(0, min(x + bw, fx + fbw) - max(x, fx))
            inter_y = max(0, min(y + bh, fy + fbh) - max(y, fy))
            inter_area = inter_x * inter_y
            union_area = (bw * bh) + (fbw * fbh) - inter_area
            if union_area > 0 and (inter_area / union_area) > 0.45:
                is_dup = True
                break
        if not is_dup:
            filtered_cells.append(cell)

    # If OpenCV found enough structured cells (>= 4), determine columns and reading order
    if len(filtered_cells) >= 4:
        # Cluster into columns by X center coordinate
        centers_x = [c[0] + c[2] / 2 for c in filtered_cells]
        col_clusters: Dict[int, List[Tuple[int, int, int, int]]] = {}

        # Estimate column step
        col_width_approx = sum(c[2] for c in filtered_cells) / len(filtered_cells)
        tolerance = col_width_approx * 0.5

        sorted_by_x = sorted(filtered_cells, key=lambda c: c[0])
        columns: List[List[Tuple[int, int, int, int]]] = []

        for cell in sorted_by_x:
            cx = cell[0] + cell[2] / 2
            placed = False
            for col in columns:
                col_cx = sum(c[0] + c[2] / 2 for c in col) / len(col)
                if abs(cx - col_cx) < tolerance:
                    col.append(cell)
                    placed = True
                    break
            if not placed:
                columns.append([cell])

        # Sort columns left to right
        columns.sort(key=lambda col: sum(c[0] for c in col) / len(col))
        num_cols = len(columns)

        # Sort cells within each column top to bottom
        for col in columns:
            col.sort(key=lambda c: c[1])

        boxes_list = []
        box_index = 0

        if reading_order == "column_first":
            for col_idx, col in enumerate(columns):
                for row_idx, (cx, cy, cbw, cbh) in enumerate(col):
                    abs_x = px + cx
                    abs_y = py + cy
                    boxes_list.append({
                        "index": box_index,
                        "colIndex": col_idx,
                        "rowIndex": row_idx,
                        "x": round((abs_x / gray.shape[1]) * 100, 2),
                        "y": round((abs_y / gray.shape[0]) * 100, 2),
                        "width": round((cbw / gray.shape[1]) * 100, 2),
                        "height": round((cbh / gray.shape[0]) * 100, 2),
                        "source": "opencv_lines"
                    })
                    box_index += 1
        else: # row_first
            max_rows = max(len(col) for col in columns)
            for row_idx in range(max_rows):
                for col_idx, col in enumerate(columns):
                    if row_idx < len(col):
                        cx, cy, cbw, cbh = col[row_idx]
                        abs_x = px + cx
                        abs_y = py + cy
                        boxes_list.append({
                            "index": box_index,
                            "colIndex": col_idx,
                            "rowIndex": row_idx,
                            "x": round((abs_x / gray.shape[1]) * 100, 2),
                            "y": round((abs_y / gray.shape[0]) * 100, 2),
                            "width": round((cbw / gray.shape[1]) * 100, 2),
                            "height": round((cbh / gray.shape[0]) * 100, 2),
                            "source": "opencv_lines"
                        })
                        box_index += 1

        return {
            "detectionMethod": "opencv_lines",
            "columnsDetected": num_cols,
            "rowsDetected": max(len(c) for c in columns),
            "totalBoxes": len(boxes_list),
            "readingOrder": reading_order,
            "boxes": boxes_list
        }

    # FALLBACK: Hybrid Grid Synthesis if lines are faint, irregular or omitted
    cols = expected_cols if expected_cols in [1, 2, 3, 4] else 2
    rows = 4 if cols >= 2 else 10
    total_w = gray.shape[1]
    total_h = gray.shape[0]

    # Margin inside detected page boundary
    content_x = px + int(pw * 0.03)
    content_y = py + int(ph * 0.08)
    content_w = int(pw * 0.94)
    content_h = int(ph * 0.88)

    col_w = content_w / cols
    row_h = content_h / rows
    gap_x = col_w * 0.04
    gap_y = row_h * 0.05

    fallback_boxes = []
    idx = 0

    if reading_order == "column_first":
        for c in range(cols):
            for r in range(rows):
                bx = content_x + (c * col_w) + (gap_x / 2)
                by = content_y + (r * row_h) + (gap_y / 2)
                bw = col_w - gap_x
                bh = row_h - gap_y
                fallback_boxes.append({
                    "index": idx,
                    "colIndex": c,
                    "rowIndex": r,
                    "x": round((bx / total_w) * 100, 2),
                    "y": round((by / total_h) * 100, 2),
                    "width": round((bw / total_w) * 100, 2),
                    "height": round((bh / total_h) * 100, 2),
                    "source": "hybrid_template_fallback"
                })
                idx += 1
    else:
        for r in range(rows):
            for c in range(cols):
                bx = content_x + (c * col_w) + (gap_x / 2)
                by = content_y + (r * row_h) + (gap_y / 2)
                bw = col_w - gap_x
                bh = row_h - gap_y
                fallback_boxes.append({
                    "index": idx,
                    "colIndex": c,
                    "rowIndex": r,
                    "x": round((bx / total_w) * 100, 2),
                    "y": round((by / total_h) * 100, 2),
                    "width": round((bw / total_w) * 100, 2),
                    "height": round((bh / total_h) * 100, 2),
                    "source": "hybrid_template_fallback"
                })
                idx += 1

    return {
        "detectionMethod": "hybrid_template_fallback",
        "columnsDetected": cols,
        "rowsDetected": rows,
        "totalBoxes": len(fallback_boxes),
        "readingOrder": reading_order,
        "boxes": fallback_boxes
    }


def main():
    parser = argparse.ArgumentParser(description="OpenCV Grid Detector for DentalOS")
    parser.add_argument("image_path", help="Path to input image file")
    parser.add_argument("--expected-cols", type=int, default=0, help="Expected number of columns (hint)")
    parser.add_argument("--reading-order", type=str, default="column_first", choices=["column_first", "row_first"])
    parser.add_argument("--output-crops-dir", type=str, default=None, help="Directory to save cropped box images")
    parser.add_argument("--no-deskew", action="store_true", help="Disable automatic deskewing")

    args = parser.parse_args()

    if not os.path.isfile(args.image_path):
        print(json.dumps({"success": False, "error": f"Image file not found: {args.image_path}"}))
        sys.exit(1)

    image = cv2.imread(args.image_path)
    if image is None:
        print(json.dumps({"success": False, "error": "Unable to decode image file via OpenCV"}))
        sys.exit(1)

    orig_h, orig_w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    rotation_angle = 0.0
    if not args.no_deskew:
        gray, rotation_angle = deskew_image(gray)

    page_boundary = detect_page_boundary(image)
    grid_result = detect_grid_boxes(
        gray,
        page_boundary,
        expected_cols=args.expected_cols,
        reading_order=args.reading_order
    )

    # Optional cropping to disk
    crops_saved = []
    if args.output_crops_dir:
        os.makedirs(args.output_crops_dir, exist_ok=True)
        for box in grid_result["boxes"]:
            bx = int((box["x"] / 100.0) * orig_w)
            by = int((box["y"] / 100.0) * orig_h)
            bw = int((box["width"] / 100.0) * orig_w)
            bh = int((box["height"] / 100.0) * orig_h)
            
            # Boundary clamp
            bx = max(0, min(orig_w - 1, bx))
            by = max(0, min(orig_h - 1, by))
            bw = max(1, min(orig_w - bx, bw))
            bh = max(1, min(orig_h - by, bh))

            crop = image[by:by+bh, bx:bx+bw]
            crop_name = f"box_{box['index']}.jpg"
            crop_path = os.path.join(args.output_crops_dir, crop_name)
            cv2.imwrite(crop_path, crop)
            crops_saved.append(crop_name)

    response = {
        "success": True,
        "width": orig_w,
        "height": orig_h,
        "rotationAngle": round(rotation_angle, 2),
        "pageBoundary": {
            "x": round((page_boundary[0] / orig_w) * 100, 2),
            "y": round((page_boundary[1] / orig_h) * 100, 2),
            "width": round((page_boundary[2] / orig_w) * 100, 2),
            "height": round((page_boundary[3] / orig_h) * 100, 2)
        },
        **grid_result,
        "cropsSaved": crops_saved
    }

    print(json.dumps(response))
    sys.exit(0)


if __name__ == "__main__":
    main()

