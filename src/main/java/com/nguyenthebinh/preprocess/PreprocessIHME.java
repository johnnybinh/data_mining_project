package com.nguyenthebinh.preprocess;

import java.io.*;
import java.util.*;
import weka.core.*;
import weka.core.converters.ConverterUtils.DataSource;
import weka.core.converters.ArffSaver;
import weka.core.converters.CSVSaver;
import weka.filters.Filter;
import weka.filters.unsupervised.attribute.Remove;
import weka.filters.unsupervised.attribute.ReplaceMissingValues;
import weka.filters.unsupervised.attribute.Normalize;

public class PreprocessIHME {

    // Remove single quotes from CSV (in-memory) — returns cleaned path
    public static String cleanIHME(String inputFile, String outputFile) throws Exception {
        List<String> lines = java.nio.file.Files.readAllLines(java.nio.file.Paths.get(inputFile));
        List<String> out = new ArrayList<>();
        for (String l : lines) {
            out.add(l.replace("'", ""));
        }
        java.nio.file.Files.write(java.nio.file.Paths.get(outputFile), out);
        System.out.println("IHME: cleaned quotes saved to " + outputFile);
        return outputFile;
    }

    private static double percentile(List<Double> vals, double p) {
        if (vals == null || vals.isEmpty()) return Double.NaN;
        Collections.sort(vals);
        if (p <= 0) return vals.get(0);
        if (p >= 100) return vals.get(vals.size() - 1);
        double n = vals.size();
        double pos = p * (n + 1) / 100.0;
        if (pos <= 1.0) return vals.get(0);
        if (pos >= n) return vals.get(vals.size() - 1);
        int lower = (int) Math.floor(pos) - 1;
        int upper = lower + 1;
        double frac = pos - Math.floor(pos);
        return vals.get(lower) + frac * (vals.get(upper) - vals.get(lower));
    }

    public static Instances fillMissing(Instances data) throws Exception {
        ReplaceMissingValues rmv = new ReplaceMissingValues();
        rmv.setInputFormat(data);
        return Filter.useFilter(data, rmv);
    }

    // Remove a set of attributes by name (if present)
    public static Instances removeAttributesByName(Instances data, String[] removeNames) throws Exception {
        List<Integer> idxList = new ArrayList<>();
        for (String name : removeNames) {
            Attribute a = data.attribute(name);
            if (a != null) idxList.add(a.index() + 1);
        }
        if (idxList.isEmpty()) return data;
        Collections.sort(idxList);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < idxList.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(idxList.get(i));
        }
        Remove rm = new Remove();
        rm.setAttributeIndices(sb.toString());
        rm.setInputFormat(data);
        return Filter.useFilter(data, rm);
    }

    public static Instances removeOutliersIQR(Instances data, String excludeAttrNames) throws Exception {
        Set<String> excludeSet = new HashSet<>();
        if (excludeAttrNames != null && !excludeAttrNames.isEmpty()) {
            for (String s : excludeAttrNames.split(",")) excludeSet.add(s.trim());
        }

        int A = data.numAttributes();
        int N = data.numInstances();
        double[] lower = new double[A];
        double[] upper = new double[A];
        Arrays.fill(lower, Double.NaN);
        Arrays.fill(upper, Double.NaN);

        for (int a = 0; a < A; a++) {
            Attribute att = data.attribute(a);
            if (!att.isNumeric()) continue;
            if (excludeSet.contains(att.name())) continue;

            List<Double> vals = new ArrayList<>();
            for (int i = 0; i < N; i++) {
                Instance inst = data.instance(i);
                if (!inst.isMissing(a)) vals.add(inst.value(a));
            }
            if (vals.size() < 5) continue;
            double q1 = percentile(vals, 25);
            double q3 = percentile(vals, 75);
            double iqr = q3 - q1;
            lower[a] = q1 - 1.5 * iqr;
            upper[a] = q3 + 1.5 * iqr;
        }

        boolean[] out = new boolean[N];
        for (int i = 0; i < N; i++) {
            Instance inst = data.instance(i);
            boolean isOut = false;
            for (int a = 0; a < A; a++) {
                if (Double.isNaN(lower[a]) || Double.isNaN(upper[a])) continue;
                if (inst.isMissing(a)) continue;
                double v = inst.value(a);
                if (v < lower[a] || v > upper[a]) { isOut = true; break; }
            }
            out[i] = isOut;
        }

        Instances cleaned = new Instances(data, 0);
        int removed = 0;
        for (int i = 0; i < N; i++) {
            if (!out[i]) cleaned.add((Instance) data.instance(i).copy());
            else removed++;
        }
        System.out.println("IHME: Outliers removed = " + removed);
        return cleaned;
    }

    // Normalize numeric except exclusions (same approach as WHR)
    public static Instances normalizeExcept(Instances data, String excludeAttrNames) throws Exception {
        Set<String> excludeSet = new HashSet<>();
        if (excludeAttrNames != null && !excludeAttrNames.isEmpty()) {
            for (String s : excludeAttrNames.split(",")) excludeSet.add(s.trim());
        }

        // Save excluded attributes and values
        ArrayList<Attribute> excludedAttrs = new ArrayList<>();
        List<double[]> excludedValues = new ArrayList<>();
        for (String ex : excludeSet) {
            Attribute a = data.attribute(ex);
            if (a != null) {
                excludedAttrs.add(a);
                double[] vals = new double[data.numInstances()];
                for (int i = 0; i < data.numInstances(); i++) vals[i] = data.instance(i).value(a.index());
                excludedValues.add(vals);
            }
        }

        if (!excludedAttrs.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (Attribute a : excludedAttrs) {
                if (sb.length() > 0) sb.append(",");
                sb.append(a.index() + 1);
            }
            Remove rm = new Remove();
            rm.setAttributeIndices(sb.toString());
            rm.setInputFormat(data);
            data = Filter.useFilter(data, rm);
        }

        Normalize norm = new Normalize();
        norm.setInputFormat(data);
        Instances normalized = Filter.useFilter(data, norm);

        // Insert excluded attributes back
        for (int k = excludedAttrs.size() - 1; k >= 0; k--) {
            Attribute a = excludedAttrs.get(k);
            int pos = a.index();
            normalized.insertAttributeAt(a, pos);
            double[] vals = excludedValues.get(k);
            for (int i = 0; i < normalized.numInstances(); i++) {
                normalized.instance(i).setValue(pos, vals[i]);
            }
        }
        return normalized;
    }

    // Save correlation matrix CSV using provided order of numeric attributes
    public static void saveCorrelationMatrixCSV(Instances data, String[] order, String outCsvPath) {
        try (PrintWriter pw = new PrintWriter(new FileWriter(outCsvPath))) {
            int n = order.length;
            int[] idx = new int[n];
            for (int i = 0; i < n; i++) idx[i] = data.attribute(order[i]).index();

            // header
            pw.print("attr");
            for (String s : order) pw.print("," + s);
            pw.println();

            for (int i = 0; i < n; i++) {
                pw.print(order[i]);
                double[] xi = data.attributeToDoubleArray(idx[i]);
                for (int j = 0; j < n; j++) {
                    double[] xj = data.attributeToDoubleArray(idx[j]);
                    double c = Utils.correlation(xi, xj, xi.length);
                    pw.print("," + String.format(Locale.US, "%.6f", c));
                }
                pw.println();
            }
            System.out.println("IHME: Correlation matrix saved to: " + outCsvPath);
        } catch (Exception e) {
            System.out.println("IHME: Error saving correlation CSV: " + e.getMessage());
        }
    }

    public static void saveArff(Instances data, String path) throws Exception {
        ArffSaver saver = new ArffSaver();
        saver.setInstances(data);
        saver.setFile(new File(path));
        saver.writeBatch();
    }

    public static void saveCsv(Instances data, String path) throws Exception {
        CSVSaver saver = new CSVSaver();
        saver.setInstances(data);
        saver.setFile(new File(path));
        saver.writeBatch();
    }

    // MAIN
    public static void main(String[] args) throws Exception {
        String inPath = "./datasets/IHME-GBD_2023_DATA-f085d7ea-1.csv";
        String cleaned = "./datasets/IHME_clean.csv";
        String outCsv = "./datasets/IHME_preprocessed.csv";
        String outArff = "./datasets/IHME_preprocessed.arff";
        String corrCsv = "./datasets/IHME_correlation_matrix.csv";

        // 0) clean quotes (example: 'United States' -> United States)
        String cleanedPath = cleanIHME(inPath, cleaned);

        DataSource src = new DataSource(cleanedPath);
        Instances data = src.getDataSet();

        System.out.println("IHME: Loaded instances=" + data.numInstances() + " attrs=" + data.numAttributes());

        // 1) fill missing values
        data = fillMissing(data);

        // 2) remove useless: sex/age/cause ids/names and metric_id if present
        String[] removeNames = new String[] {
            "sex_id","sex_name","age_id","age_name","cause_id","cause_name","location_id","metric_id"
        };
        data = removeAttributesByName(data, removeNames);

        // 3) remove outliers excluding location_name and year 
        data = removeOutliersIQR(data, "location_name,year");

        // 4) normalize except location_name and year
        data = normalizeExcept(data, "location_name,year");

        // 5) save correlation matrix for these numeric attrs 
        String[] order = new String[] {
            "val","upper","lower"
        };
        // ensure attributes exist
        List<String> exist = new ArrayList<>();
        for (String s : order) if (data.attribute(s) != null) exist.add(s);
        saveCorrelationMatrixCSV(data, exist.toArray(new String[0]), corrCsv);

        // 6) save outputs
        saveArff(data, outArff);
        saveCsv(data, outCsv);

        System.out.println("IHME: Preprocessing completed. Saved: " + outCsv + " and " + outArff);
    }
}
