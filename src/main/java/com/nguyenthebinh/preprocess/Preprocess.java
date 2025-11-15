package com.nguyenthebinh.preprocess;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;


import weka.core.Instances;
import weka.core.Utils;
import weka.core.Attribute;
import weka.core.Instance;
import weka.core.converters.ConverterUtils.DataSource;
import weka.core.converters.ArffSaver;
import weka.core.converters.CSVSaver;


import weka.filters.Filter;
import weka.filters.unsupervised.attribute.Remove;
import weka.filters.unsupervised.attribute.ReplaceMissingValues;
import weka.filters.unsupervised.attribute.Normalize;

public class Preprocess {
  // algorithms implementation
  /**
     * [HELPER] Lấy chuỗi chỉ số 1-based (ví dụ "2,3,5-7")
     * của các thuộc tính SỐ (numeric), trừ các tên đã cho.
     */
    public static String getNumericAttributeIndicesString(Instances data, String... excludeAttrNames) {
        StringBuilder indices = new StringBuilder();
        List<String> excludeList = Arrays.asList(excludeAttrNames);
        
        for (int i = 0; i < data.numAttributes(); i++) {
            if (excludeList.contains(data.attribute(i).name())) {
                continue;
            }
            
            //  Only numeric
            if (data.attribute(i).isNumeric()) {
                if (indices.length() > 0) {
                    indices.append(",");
                }
                indices.append(i + 1); // Weka sử dụng chỉ số 1-based
            }
        }
        return indices.toString();
    }

    private static double percentile(List<Double> vals, double p) {
        if (vals == null || vals.isEmpty()) return Double.NaN;
        if (p <= 0) return vals.get(0);
        if (p >= 100) return vals.get(vals.size() - 1);

        double n = vals.size();
        double pos = p * (n + 1) / 100.0;
        if (pos < 1.0) return vals.get(0);
        if (pos >= n) return vals.get(vals.size() - 1);

        int lowerIndex = (int) Math.floor(pos) - 1; // zero-based
        int upperIndex = lowerIndex + 1;
        double fraction = pos - Math.floor(pos);
        double lowerValue = vals.get(lowerIndex);
        double upperValue = vals.get(upperIndex);
        return lowerValue + fraction * (upperValue - lowerValue);
    }
    
    // compute correlation matrix
    public static void printCorrelationMatrix(Instances data) throws Exception {

        // Thứ tự attribute, lấy ladder_score làm chuẩn
        String[] order = {
                "ladder_score",
                "log_gdp_per_capita",
                "social_support",
                "healthy_life_expectancy",
                "freedom_to_make_life_choices",
                "generosity",
                "perceptions_of_corruption"
        };

        int n = order.length;
        double[][] corr = new double[n][n];

        // Lấy index trong dataset
        int[] idx = new int[n];
        for (int i = 0; i < n; i++) {
            idx[i] = data.attribute(order[i]).index();
        }

        // Tính Pearson Correlation
        for (int i = 0; i < n; i++) {
            for (int j = i; j < n; j++) {

                double[] x = data.attributeToDoubleArray(idx[i]);
                double[] y = data.attributeToDoubleArray(idx[j]);

                double c = Utils.correlation(x, y, x.length);

                corr[i][j] = c;
                corr[j][i] = c;   // ma trận đối xứng
            }
        }
        // In header
        System.out.print(String.format("%30s", ""));
        for (String s : order) {
            System.out.print(String.format("%30s", s));
        }
        System.out.println();

        // In matrix
        for (int i = 0; i < n; i++) {
            System.out.print(String.format("%30s", order[i]));
            for (int j = 0; j < n; j++) {
                System.out.print(String.format("%30.4f", corr[i][j]));
            }
            System.out.println();
        }
    }

    // fill missing values (replace null values with mean (numeric) /mode (nominal))
    public static Instances fillMissing(Instances data) throws Exception {
        ReplaceMissingValues replace = new ReplaceMissingValues();
        replace.setInputFormat(data);
        return Filter.useFilter(data, replace);
    }

    // remove attribute by index (1-based)
    public static Instances removeAttribute(Instances data, String indexToRemove) throws Exception {
        Remove remove = new Remove();
        remove.setAttributeIndices(indexToRemove); // Dùng String 1-based
        remove.setInputFormat(data);
        return Filter.useFilter(data, remove);
    }

    // normalize data
    // Normalize except a named attribute ("year")
    public static Instances normalizeExcept(Instances data, int excludeIndex) throws Exception {

        //  1) Tách cột exclude 
        Attribute excludedAttr = data.attribute(excludeIndex);
        Instances dataCopy = new Instances(data);

        // Lưu các giá trị exclude vào mảng
        double[] excludedValues = new double[dataCopy.numInstances()];
        for (int i = 0; i < dataCopy.numInstances(); i++) {
            excludedValues[i] = dataCopy.instance(i).value(excludeIndex);
        }

        // Remove filter để loại bỏ cột exclude
        Remove rm = new Remove();
        rm.setAttributeIndices("" + (excludeIndex + 1));  // Weka sử dụng chỉ số 1-based
        rm.setInvertSelection(false);
        rm.setInputFormat(dataCopy);

        Instances dataNoExclude = Filter.useFilter(dataCopy, rm);

        //  2) Normalize trên phần còn lại 
        Normalize norm = new Normalize();
        norm.setInputFormat(dataNoExclude);

        Instances normalized = Filter.useFilter(dataNoExclude, norm);

        //  3) Chèn lại cột exclude
        normalized.insertAttributeAt(excludedAttr, excludeIndex);

        // Gán lại giá trị cho cột exclude
        for (int i = 0; i < normalized.numInstances(); i++) {
            normalized.instance(i).setValue(excludeIndex, excludedValues[i]);
        }

        return normalized;
    }
    
    // remove outlier instances
    public static Instances removeOutlierInstances(Instances data, String... excludeAttrNames) throws Exception {
        // Lấy danh sách tên cần loại trừ nhanh
        List<String> exclude = Arrays.asList(excludeAttrNames);

        int nAttrs = data.numAttributes();
        int nInst = data.numInstances();

        // Map từng attribute index -> (lower, upper)
        double[] lowerBounds = new double[nAttrs];
        double[] upperBounds = new double[nAttrs];
        Arrays.fill(lowerBounds, Double.NaN);
        Arrays.fill(upperBounds, Double.NaN);

        // 1) Tính bounds (Q1, Q3, IQR) cho từng numeric attribute không bị exclude
        for (int a = 0; a < nAttrs; a++) {
            Attribute att = data.attribute(a);
            if (!att.isNumeric()) continue;
            if (exclude.contains(att.name())) continue;

            // Thu thập các giá trị không bị missing
            List<Double> vals = new ArrayList<>();
            for (int i = 0; i < nInst; i++) {
                Instance inst = data.instance(i);
                if (!inst.isMissing(a)) {
                    vals.add(inst.value(a));
                }
            }

            if (vals.size() < 1) {
                // không có dữ liệu hợp lệ
                continue;
            }

            // sort và tính Q1, Q3
            Collections.sort(vals);
            double q1 = percentile(vals, 25.0);
            double q3 = percentile(vals, 75.0);
            double iqr = q3 - q1;
            double lower = q1 - 1.5 * iqr;
            double upper = q3 + 1.5 * iqr;

            lowerBounds[a] = lower;
            upperBounds[a] = upper;
        }

        // 2) Đánh dấu instance có outlier (nếu bất kỳ thuộc tính nào nằm ngoài bounds)
        boolean[] isOutlier = new boolean[nInst];
        Arrays.fill(isOutlier, false);

        for (int i = 0; i < nInst; i++) {
            Instance inst = data.instance(i);
            boolean out = false;
            for (int a = 0; a < nAttrs; a++) {
                // chỉ kiểm tra những attribute có bound hợp lệ
                if (Double.isNaN(lowerBounds[a]) || Double.isNaN(upperBounds[a])) continue;
                if (inst.isMissing(a)) continue;
                double v = inst.value(a);
                if (v < lowerBounds[a] || v > upperBounds[a]) {
                    out = true;
                    break;
                }
            }
            isOutlier[i] = out;
        }

        // 3) Tạo Instances mới không chứa các instance bị đánh dấu là outlier
        Instances outData = new Instances(data, 0);
        int removedCount = 0;
        for (int i = 0; i < nInst; i++) {
            if (!isOutlier[i]) {
                // copy instance để an toàn
                outData.add((Instance) data.instance(i).copy());
            } else {
                removedCount++;
            }
        }

        System.out.println("Removed instances containing outliers: " + removedCount + ". Remaining: " + outData.numInstances());
        return outData;
    }

    // save to ARFF file
    public static void saveArff(Instances data, String outputPath) throws Exception {
        ArffSaver saver = new ArffSaver();
        saver.setInstances(data);
        saver.setFile(new File(outputPath));
        saver.writeBatch();
    }

    // save to CSV file
    public static void saveCsv(Instances data, String outputPath) throws Exception {
        CSVSaver saver = new CSVSaver();
        saver.setInstances(data);
        saver.setFile(new File(outputPath));
        saver.writeBatch();
}


  // test your algorithms
  public static void main(String[] args) throws Exception {
    try {
        DataSource src = new DataSource("./datasets/WHR_merged_3.csv");
        Instances data = src.getDataSet();

        System.out.println("Original instances: " + data.numInstances());
        System.out.println("Attributes: " + data.numAttributes());

        // 1. Điền giá trị thiếu
        data = fillMissing(data);
        System.out.println("Step 1: Filled missing values.");

        // 2. Xử lý Outliers 
        String tenCotYear = "year"; 

        // 3. remove outlier instances
        data = removeOutlierInstances(data, tenCotYear); 
        
        System.out.println("Step 2: Handled outliers.");

        // 4. Chuẩn hóa
        data = normalizeExcept(data, 1); // Giữ nguyên cột "year" (index 1)
        System.out.println("Step 3: Normalized numeric attributes.");
        
        //In correlation matrix
        printCorrelationMatrix(data);

        // Lưu dữ liệu preproccess ra file ARFF
        saveArff(data, "./datasets/WHR_preprocessed.arff");
        saveCsv(data, "./datasets/WHR_preprocessed.csv");


        System.out.println("\n--- AFTER PREPROCESSING ---");
        System.out.println("Final Instances: " + data.numInstances());
        System.out.println("Final Attributes: " + data.numAttributes());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
