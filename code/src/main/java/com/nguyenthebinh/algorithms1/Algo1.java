package com.nguyenthebinh.algorithms1;

import java.io.File;
import java.util.Random;

import weka.core.Instances;
import weka.core.converters.CSVLoader;
import weka.classifiers.functions.LinearRegression;
import weka.classifiers.Evaluation;
import weka.core.SerializationHelper;

//Linear Regresion Implementation
public class Algo1 {
    // algorithms implementation

    // test your algorithms
    public static void main(String[] args) throws Exception {
        // Load data
        // TODO: Use CSV2arff class to convert. Remove straight usages of CSV
        CSVLoader csvLoader = new CSVLoader();
        String filePath = "src/main/java/com/nguyenthebinh/datasets/Final_Clean.csv";
        csvLoader.setFile(new File(filePath));
        Instances dataset = csvLoader.getDataSet();
        dataset.setClassIndex(dataset.numAttributes() - 1); // set column Val as Target

        // dataset modification

        // Classification
        LinearRegression linearRegression = new LinearRegression();
        // models Options
        String[] options = weka.core.Utils.splitOptions("-S 1 -R 1.0 -num-decimal-places 4");
        linearRegression.setOptions(options);
        // Training Options
        linearRegression.buildClassifier(dataset);

        // Evaluation

        Evaluation eval = new Evaluation(dataset);
        eval.crossValidateModel(linearRegression, dataset, 10, new Random(1));
        System.out.println(eval.toSummaryString());

        // Print Stats
        System.out.println(linearRegression.toString());
        // Save model
        SerializationHelper.write("src/main/java/com/nguyenthebinh/models/linearRegression.model", linearRegression);
    }
}