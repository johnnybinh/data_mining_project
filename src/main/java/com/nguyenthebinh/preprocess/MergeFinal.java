package com.nguyenthebinh.preprocess;

import java.io.*;
import java.util.*;

public class MergeFinal {

    public static String normalizeCountry(String s) {
        if (s == null) return "";
        String t = s.toLowerCase();
        t = t.replace("the ", "")
             .replace("republic of ", "")
             .replace("of america", "")
             .replace("u.s.a", "usa")
             .replace("u.s.", "usa")
             .replaceAll("\\(.*?\\)", "")
             .replaceAll("[^a-z0-9 ]", " ")
             .replaceAll(" +", " ")
             .trim();
        return t;
    }

    // compute Correlation Matrix ra file CSV
    public static void saveCorrelationMatrixCSV(List<String[]> rows, String outCsvPath) {

        try (PrintWriter pw = new PrintWriter(new FileWriter(outCsvPath))) {

            // Lấy header và tìm các cột numeric
            String[] header = rows.get(0);
            int colCount = header.length;

            List<Integer> numCols = new ArrayList<>();
            for (int col = 0; col < colCount; col++) {
                boolean isNumeric = true;
                for (int i = 1; i < rows.size(); i++) {
                    String v = rows.get(i)[col];
                    if (v == null || v.isEmpty()) continue;
                    try { Double.parseDouble(v); }
                    catch (Exception e) { isNumeric = false; break; }
                }
                if (isNumeric) numCols.add(col);
            }

            // Nếu không có cột numeric → thoát
            if (numCols.size() < 2) {
                pw.println("Not enough numeric columns for correlation.");
                return;
            }

            // Xuất header
            pw.print("attribute");
            for (int c : numCols) pw.print("," + header[c]);
            pw.println();

            // Tính correlation giữa các numeric attributes
            for (int ci = 0; ci < numCols.size(); ci++) {
                int colI = numCols.get(ci);
                pw.print(header[colI]);

                double[] Xi = new double[rows.size() - 1];
                for (int r = 1; r < rows.size(); r++) {
                    String v = rows.get(r)[colI];
                    Xi[r - 1] = (v == null || v.isEmpty()) ? 0 : Double.parseDouble(v);
                }

                for (int cj = 0; cj < numCols.size(); cj++) {
                    int colJ = numCols.get(cj);

                    double[] Xj = new double[rows.size() - 1];
                    for (int r = 1; r < rows.size(); r++) {
                        String v = rows.get(r)[colJ];
                        Xj[r - 1] = (v == null || v.isEmpty()) ? 0 : Double.parseDouble(v);
                    }

                    // compute Pearson correlation
                    double corr = pearson(Xi, Xj);
                    pw.print("," + corr);
                }
                pw.println();
            }

            System.out.println("Correlation Matrix Saved to: " + outCsvPath);

        } catch (Exception e) {
            System.out.println("Error writing correlation CSV: " + e.getMessage());
        }
    }

    private static double pearson(double[] x, double[] y) {
        int n = x.length;
        double sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;

        for (int i = 0; i < n; i++) {
            sx += x[i];
            sy += y[i];
            sxx += x[i] * x[i];
            syy += y[i] * y[i];
            sxy += x[i] * y[i];
        }

        double cov = sxy - (sx * sy / n);
        double dx = sxx - (sx * sx / n);
        double dy = syy - (sy * sy / n);

        if (dx <= 0 || dy <= 0) return 0;
        return cov / Math.sqrt(dx * dy);
    }

    // Main merge
    public static void main(String[] args) throws Exception {
        String whrPath = "./datasets/WHR_preprocessed.csv";
        String ihmePath = "./datasets/IHME_preprocessed.csv";
        String outPath = "./datasets/Merged_Final_Clean.csv";
        String misPath = "./datasets/Merge_Mismatch_Log.txt";
        String corrOut = "./datasets/Merged_Correlation_Matrix.csv";

        BufferedReader brI = new BufferedReader(new FileReader(ihmePath));
        String ihmeHeader = brI.readLine();
        if (ihmeHeader == null) {
            System.out.println("IHME file empty: " + ihmePath);
            return;
        }
        String[] ihmeCols = ihmeHeader.split(",");

        // find indexes
        int ihmeIdxLocation = -1, ihmeIdxYear = -1, ihmeIdxVal = -1;
        for (int i = 0; i < ihmeCols.length; i++) {
            String c = ihmeCols[i].trim().toLowerCase();
            if (c.equals("location_name")) ihmeIdxLocation = i;
            if (c.equals("year")) ihmeIdxYear = i;
            if (c.equals("val")) ihmeIdxVal = i;
        }

        Map<String, String[]> ihmeMap = new HashMap<>();
        String line;
        while ((line = brI.readLine()) != null) {
            String[] parts = line.split(",", -1);
            String country = normalizeCountry(parts[ihmeIdxLocation]);
            String year = parts[ihmeIdxYear].trim();
            ihmeMap.put(country + "-" + year, parts);
        }
        brI.close();

        BufferedReader brW = new BufferedReader(new FileReader(whrPath));
        String whrHeader = brW.readLine();
        if (whrHeader == null) {
            System.out.println("WHR file empty: " + whrPath);
            return;
        }
        String[] whrCols = whrHeader.split(",");

        int whrIdxCountry = -1, whrIdxYear = -1;
        for (int i = 0; i < whrCols.length; i++) {
            String c = whrCols[i].trim().toLowerCase();
            if (c.equals("country_name")) whrIdxCountry = i;
            if (c.equals("year")) whrIdxYear = i;
        }

        PrintWriter pw = new PrintWriter(new FileWriter(outPath));
        PrintWriter pmis = new PrintWriter(new FileWriter(misPath));

        // CSV rows collector
        List<String[]> mergedRows = new ArrayList<>();

        // write header
        String finalHeader = "Country_Year," + whrHeader + ",val";
        pw.println(finalHeader);
        mergedRows.add(finalHeader.split(","));

        List<String> mismatches = new ArrayList<>();
        int merged = 0;

        while ((line = brW.readLine()) != null) {
            String[] parts = line.split(",", -1);
            String origCountry = parts[whrIdxCountry];
            String year = parts[whrIdxYear];
            String key = normalizeCountry(origCountry) + "-" + year;
            if (ihmeMap.containsKey(key)) {
                String val = ihmeMap.get(key)[ihmeIdxVal];
                String countryYear = origCountry + "_" + year;
                String outLine = countryYear + "," + line + "," + val;
                pw.println(outLine);
                mergedRows.add(outLine.split(","));
                merged++;
            } else {
                mismatches.add(origCountry + " | " + year);
            }
        }
        brW.close();
        pw.close();

        for (String s : mismatches) pmis.println(s);
        pmis.close();

        System.out.println("Merge completed. Merged rows: " + merged + ". Mismatches: " + mismatches.size());
        System.out.println("Output: " + outPath + ", mismatch log: " + misPath);

        // Compute correlation matrix 
        saveCorrelationMatrixCSV(mergedRows, corrOut);
    }
}
