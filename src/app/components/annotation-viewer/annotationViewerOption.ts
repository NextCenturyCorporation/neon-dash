/*
 * Copyright 2017 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { FieldMetaData } from '../../dataset';
//import { BaseNeonOptions } from '../../BaseNeonOptions'

export class Annotation {
    annotationLabel: string;
    startField: number;
    endField: number;
    textField: string;
    typeField: string;
}

export class AnnotationFields {
    startCharacterField: any;
    endCharacterField: any;
    textField: any;
    typeField: any;
}

export class AnnotationViewerOptions {
    annotations: Annotation[];
    anootationsInAnotherTable: boolean;
    annotationDatabase: FieldMetaData;
    annotationTable: FieldMetaData;
    annotationFields: AnnotationFields;
    docCount: number;
    documentIdFieldInAnnotationTable: {};
    documentIdFieldInDocumentTable: {};
    documentLimit: number;
    documentTextField: any;
    data: Data[];
    details: FieldMetaData;
    annotationViewerRequiredField: any;
    annotationViewerOptionalField: any;
}

export class Data {
    documents: any;
    annotations: any[];
    details: any;
    parts: Part[];
}

export class Part {
    annotation: boolean;
    highlightColor: any;
    text: string;
    type: string;
}

export class Details {
    detailLabel: string;
    detailField: FieldMetaData;
}
