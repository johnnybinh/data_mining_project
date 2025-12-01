package com.nguyenthebinh.algo2;

import java.io.File;
import java.util.Random;

import weka.core.Instances;
import weka.core.converters.CSVLoader;
import weka.classifiers.trees.M5P;
import weka.classifiers.Evaluation;
import weka.core.SerializationHelper;

//Linear Regresion Implementation
public class Algo2 {
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
    M5P M5P = new M5P();
    // models Options
    String[] options = weka.core.Utils.splitOptions("-M 4.0 -num-decimal-places 4");
    M5P.setOptions(options);
    // Training Options
    M5P.buildClassifier(dataset);

    // Evaluation

    Evaluation eval = new Evaluation(dataset);
    eval.crossValidateModel(M5P, dataset, 10, new Random(1));
    System.out.println(eval.toSummaryString());

    // Print Stats
    System.out.println(M5P.toString());
    // Save model
    SerializationHelper.write("src/main/java/com/nguyenthebinh/models/M5p.model", M5P);
  }
}