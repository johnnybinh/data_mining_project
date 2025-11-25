package com.nguyenthebinh;

import weka.core.Instances;
import weka.core.converters.ConverterUtils.DataSource;

public class Main {
    public static void main(String[] args) throws Exception {
        DataSource source = new DataSource("./datasets/WHR_merged_3.csv");
        Instances instance = source.getDataSet();

        System.out.println(instance.numInstances());

        System.out.println("Hello world!");
    }
}