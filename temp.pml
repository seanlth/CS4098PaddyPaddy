process Diabetes_assessment {
        action Assess_patient_symptoms {
                requires {patient_symptoms}
                provides {assessment.suspect_diabetes}
        }
        branch {
                action Glucose_test {
                        requires {assessment.suspect_diabetes}
                        provides {blood_test.glucose_test}
                }
                action Cholesterol_test {
                        requires {assessment.suspect_diabetes}
                        provides {blood_test.cholesterol_test}
                }
        }
        action Assess_diabetes {
                requires {blood_test.glucose_test && (optional) blood_test.cholesterol_test}
                provides {diagnosis.diabetes}
        }
}
