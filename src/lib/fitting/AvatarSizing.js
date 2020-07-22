﻿import * as THREE from "@/lib/threejs/three";
import { readMap, readByteArray } from "@/lib/clo/file/KeyValueMapReader";

const MEASUREMENT_LIST_NAME = {
  // Base
  HEIGHT_Total: 0,
  WEIGHT_Total: 1,

  // Circumference
  CIRCUMFERENCE_Bust: 2,
  CIRCUMFERENCE_MidNeck: 3,
  CIRCUMFERENCE_NeckBase: 4,
  CIRCUMFERENCE_UnderBust: 5,
  CIRCUMFERENCE_Waist: 6,
  CIRCUMFERENCE_HighHip: 7,
  CIRCUMFERENCE_LowHip: 8,
  CIRCUMFERENCE_Thigh: 9,
  CIRCUMFERENCE_MidThigh: 10,
  CIRCUMFERENCE_Knee: 11,
  CIRCUMFERENCE_Calf: 12,
  CIRCUMFERENCE_Ankle: 13,
  CIRCUMFERENCE_Armhole: 14,
  CIRCUMFERENCE_Bicep: 15,
  CIRCUMFERENCE_Elbow: 16,
  CIRCUMFERENCE_Wrist: 17,

  // Height
  HEIGHT_HPS: 18,
  HEIGHT_Shoulder: 19,
  HEIGHT_ShoulderDrop: 20,
  HEIGHT_APEX: 21,
  HEIGHT_UnderBust: 22,
  HEIGHT_Waist: 23,
  HEIGHT_HighHip: 24,
  HEIGHT_LowHip: 25,
  HEIGHT_Crotch: 26,
  HEIGHT_Thigh: 27,
  HEIGHT_MidThigh: 28,
  HEIGHT_Knee: 29,
  HEIGHT_Calf: 30,
  HEIGHT_Ankle: 31,

  // Length
  LENGTH_Bust_Width: 32,
  LENGTH_Bust_Depth: 33,
  LENGTH_AcrossFront: 34,
  LENGTH_AcrossBack: 35,
  LENGTH_AcrossShoulder: 36,
  LENGTH_CBNeck_Shoulder: 37, // always deactivate
  LENGTH_CFNeck_AcrossFront: 38,
  LENGTH_CBNeck_AcrossBack: 39,
  LENGTH_CFNeck_Waist: 40,
  LENGTH_CBNeck_Waist: 41,
  LENGTH_Waist_HighHip: 42,
  LENGTH_Waist_LowHip: 43,
  LENGTH_APEX_APEX: 44,
  LENGTH_HPS_APEX: 45,
  LENGTH_Halter: 46, // always deactivate
  LENGTH_Arm: 47,
  LENGTH_CBNeck_Wrist: 48,
  LENGTH_Total_Rise: 49,
  LENGTH_Front_Rise: 50, // always deactivate
  LENGTH_Back_Rise: 51, // always deactivate
  LENGTH_CrotchDepth: 52, // always deactivate
  LENGTH_CrotchWidth: 53, // always deactivate
  LENGTH_Crothch_MidThigh: 54, // always deactivate
  LENGTH_VerticalTrunk_Front: 55, // always deactivate
  LENGTH_VerticalTrunk_Back: 56, // always deactivate
  LENGTH_VerticalTrunk: 57, // always deactivate

  // End
  SIZE_OF_MEASUREMENT_LIST: 58,
};

const AVATAR_GENDER = {
  GENDER_MALE: 0,
  GENDER_FEMALE: 1,
  GENDER_BOY: 2,
  GENDER_GIRL: 3,
  GENDER_PRESCHOOL: 4,
  GENDER_NONE: 5,
  GENDER_SIZE: 6,
};

// baseMeshMap은 MVMap
// convertinMatData 는 float array
// heightWeightTo5SizesMap MVMap
// zrestSkinControllerArray 아바타 zrest의 1) skincontroller name(or matshape name), 2) 해당 메쉬의 vertexCount 3) three.js vertex3d 의 pointer 세개를 가지고 있는 triple의 array
export default class ResizableBody {
  constructor(
    gender,
    baseMeshMap,
    convertingMatData,
    heightWeightTo5SizesMap,
    zrestSkinControllerArray
  ) {
    this.mCurrentGender = gender;
    this.mFeatureEnable = new Array(
      MEASUREMENT_LIST_NAME.SIZE_OF_MEASUREMENT_LIST
    ).fill(false);

    // 다음을 default로. 따로 파일 읽을 필요 없음
    this.mFeatureEnable[MEASUREMENT_LIST_NAME.HEIGHT_Total] = true;
    this.mFeatureEnable[MEASUREMENT_LIST_NAME.CIRCUMFERENCE_Bust] = true;
    this.mFeatureEnable[MEASUREMENT_LIST_NAME.CIRCUMFERENCE_Waist] = true;
    this.mFeatureEnable[MEASUREMENT_LIST_NAME.CIRCUMFERENCE_LowHip] = true;
    this.mFeatureEnable[MEASUREMENT_LIST_NAME.LENGTH_Arm] = true;
    this.mFeatureEnable[MEASUREMENT_LIST_NAME.HEIGHT_Crotch] = true;

    this.mVertexSize = baseMeshMap.get("uiVertexCount");
    const baPosition = readByteArray("Float", baseMeshMap.get("baPosition"));

    this.mBaseVertex = new Array(this.mVertexSize);
    for (let i = 0; i < this.mVertexSize; i++) {
      this.mBaseVertex[i] = new THREE.Vector3(
        baPosition[i * 3],
        baPosition[i * 3 + 1],
        baPosition[i * 3 + 2]
      );
    }
    this.mStartIndexMap = baseMeshMap.get("mapStartIndex");
    this.mSymmetryIndex = readByteArray(
      "Uint",
      baseMeshMap.get("baSymmetryIndex")
    );

    // mConvertingMatData 읽어들이기
    this.mConvertingMatData = convertingMatData;

    // mHeightWeightTo5SizesMap
    this.mHeightWeightTo5SizesMap = heightWeightTo5SizesMap;

    this.mZrestSkinControllerArray = zrestSkinControllerArray;

    // console.log(vCount);
    // console.log(baPosition);
    console.log(baseMeshMap);
    console.log(this.mStartIndexMap);
    // console.log(this.mSymmetryIndex);
    // console.log(this.mConvertingMatData);
    // console.log(this.mHeightWeightTo5SizesMap);
  }

  inputBaseVertex = (mapSkinController) => {
    console.log("inputBaseVertex");
    console.log(mapSkinController);
    const integratedPos = new Array(this.mVertexSize * 3);
    const integratedIdx = new Array(this.mVertexSize);

    for (const entries of this.mStartIndexMap.entries()) {
      // const partName = entries[0];
      const partName = "body";
      const startIndex = entries[1];
      const partSC =
        mapSkinController.get(partName) ||
        mapSkinController.get(partName + "_Shape");
      // console.log(partName, startIndex, partSC);

      if (partSC) {
        const partMapMesh = partSC.get("mapMesh");
        const partPosition = readByteArray(
          "Float",
          partMapMesh.get("baPosition")
        );
        const partIndex = readByteArray("Uint", partMapMesh.get("baIndex"));
        console.log(partIndex);
        console.log(partPosition);
        // console.log(startIndex, partPosition.length);

        for (
          let index = startIndex;
          index < partPosition.length + startIndex;
          ++index
        ) {
          const curIdx = startIndex + index;
          integratedPos[index] = partPosition[curIdx];
          integratedIdx[index] = partIndex[curIdx] + index;
        }

        // console.log(partPosition);
        // console.log(partIndex);
      } else {
        console.warn("Skin controller missing: " + partName);
      }
    }

    this.mBaseVertex = this.convertFloatArrayToVector3Array(integratedPos);
    console.log(this.mBaseVertex);

    return integratedIdx;

    // console.log(this.mBaseVertex);
    // console.log(baseVertex);
    // for (let i = 0; i < baseVertex; ++i) {
    //   this.mBaseVertex[i] = baseVertex[i];
    // }
    // this.mBaseVertex = baseVertex;
    // test
    // if (baseVertex) {
    //   if (baseVertex.length / 3 === this.mVertexSize) {
    //     console.log("BASE VERTEX CORRECT");
    //   }
    // }
  };

  convertFloatArrayToVector3Array = (floatArray) => {
    const vec3Array = [];
    for (let v = 0; v < floatArray.length; v += 3) {
      const idx = v * 3;
      vec3Array.push(
        new THREE.Vector3(
          floatArray[idx],
          floatArray[idx + 1],
          floatArray[idx + 2]
        )
      );
    }
    return vec3Array;
  };

  computeResizing = (
    height,
    weight,
    bodyShape,
    chest,
    waist,
    hip,
    armLength,
    legLength
  ) => {
    let featureValues = new Array(
      MEASUREMENT_LIST_NAME.SIZE_OF_MEASUREMENT_LIST
    );

    var tableSize = this.getTableSize(height, weight);
    var changedSize = this.applyBodyShape(
      bodyShape,
      tableSize.chest,
      tableSize.waist,
      tableSize.hip
    );
    tableSize.chest = changedSize.chest;
    tableSize.waist = changedSize.waist;
    tableSize.hip = changedSize.hip;

    if (chest < 0) chest = tableSize.chest;
    if (waist < 0) waist = tableSize.waist;
    if (hip < 0) hip = tableSize.hip;
    if (armLength < 0) armLength = tableSize.armLength;
    if (legLength < 0) legLength = tableSize.legLength;

    featureValues[MEASUREMENT_LIST_NAME.HEIGHT_Total] = height;
    //featureValues[MEASUREMENT_LIST_NAME.WEIGHT_Total] = weight; // 의미 없다. 안쓰이기 때문에
    featureValues[MEASUREMENT_LIST_NAME.CIRCUMFERENCE_Bust] = Math.pow(
      Math.min(Math.max(65, chest), 150),
      0.5
    );
    featureValues[MEASUREMENT_LIST_NAME.CIRCUMFERENCE_Waist] = Math.pow(
      Math.min(Math.max(50, waist), 140),
      0.5
    );
    featureValues[MEASUREMENT_LIST_NAME.CIRCUMFERENCE_LowHip] = Math.pow(
      Math.min(Math.max(80, hip), 140),
      0.5
    );
    featureValues[MEASUREMENT_LIST_NAME.LENGTH_Arm] = Math.min(
      Math.max(40, armLength),
      80
    );
    featureValues[MEASUREMENT_LIST_NAME.HEIGHT_Crotch] = Math.min(
      Math.max(60, legLength),
      100
    );

    return this.computeResizingWithFeatureValues(featureValues);
  };

  computeResizingWithFeatureValues = (featureValues) => {
    const returnVertex = new Array(this.mBaseVertex.length);
    for (let i = 0; i < this.mBaseVertex.length; i++)
      returnVertex[i] = new THREE.Vector3();

    for (let i = 0; i < this.mBaseVertex.length; i++) {
      returnVertex[i].copy(this.mBaseVertex[i]);

      for (let j = 0; j < 3; j++) {
        let index = i * 3 + j;
        let featureIdx = 0;

        for (
          let k = 0;
          k < MEASUREMENT_LIST_NAME.SIZE_OF_MEASUREMENT_LIST;
          k++
        ) {
          if (this.mFeatureEnable[k]) {
            if (j == 0)
              returnVertex[i].x +=
                this.mConvertingMatData[featureIdx][index] * featureValues[k];
            else if (j == 1)
              returnVertex[i].y +=
                this.mConvertingMatData[featureIdx][index] * featureValues[k];
            else
              returnVertex[i].z +=
                this.mConvertingMatData[featureIdx][index] * featureValues[k];

            featureIdx++;
          }
        }

        if (j == 0)
          returnVertex[i].x += this.mConvertingMatData[featureIdx][index];
        else if (j == 1)
          returnVertex[i].y += this.mConvertingMatData[featureIdx][index];
        else if (j == 2)
          returnVertex[i].z += this.mConvertingMatData[featureIdx][index];
      }
    }

    this.dataSymmetrization(returnVertex);
    this.dataNormalization(returnVertex);

    console.log("after computeResizingWithFeatureValues: ");
    console.log(returnVertex);

    // const bodyStartIndex = this.mStartIndexMap.get("body");
    // console.log("bodyStartIndex: " + bodyStartIndex);
    // console.log(this.mStartIndexMap);

    return returnVertex;

    // returnVertex 순서를 실제 avt/zrest vertex order 로 변경해서 avatar의 해당 vertex에 position 값 업데이트하기
    // for (let i = 0; i < this.mZrestSkinControllerArray.length; ++i) {
    //   const matShapeName = this.mZrestSkinControllerArray[i][0];
    //   const vCount = this.mZrestSkinControllerArray[i][1];
    //   var position = this.mZrestSkinControllerArray[i][2];

    //   const startIndex = this.mStartIndexMap.get(matShapeName);

    //   for (let j = 0; j < vCount; j++)
    //     position[j].copy(returnVertex[startIndex + j]);
    // }
  };

  applyBodyShape = (_bodyShape, _chest, _waist, _hip) => {
    if (this.mCurrentGender == AVATAR_GENDER.GENDER_FEMALE) {
      switch (_bodyShape) {
        case 0: // default
          break;
        case 1: // hourglass
          _chest += 3;
          _waist += -2;
          _hip += 3;
          break;
        case 2: //inverted triangle
          _chest += 5;
          _waist += -2;
          _hip += -5;
          break;
        case 3: //round(apple)
          _chest += -2;
          _waist += 5;
          _hip += -2;
          break;
        case 4: // triangle(pear)
          _chest += -5;
          _waist += 0;
          _hip += 5;
          break;
        default:
          break;
      }
    } else if (this.mCurrentGender == AVATAR_GENDER.GENDER_MALE) {
      switch (_bodyShape) {
        case 0: // default
          break;
        case 1: // rhomboid
          _chest += 3;
          _waist += 0;
          _hip += -3;
          break;
        case 2: // inverted triangle
          _chest += 7;
          _waist += -1;
          _hip += -4;
          break;
        case 3: // oval
          _chest += -2;
          _waist += 7;
          _hip += -2;
          break;
        case 4: // triangle(pear)
          _chest += -4;
          _waist += 0;
          _hip += 5;
          break;
        default:
          break;
      }
    }

    var returnValue = {};
    returnValue.chest = _chest;
    returnValue.waist = _waist;
    returnValue.hip = _hip;

    return returnValue;
  };

  getTableSize = (height, weight) => {
    const arrSize = this.mHeightWeightTo5SizesMap
      .get(String(height))
      .get(String(weight));

    // TODO: Check if this order is correct
    const returnValue = {};
    returnValue["chest"] = arrSize[0];
    returnValue["waist"] = arrSize[1];
    returnValue["hip"] = arrSize[2];
    returnValue["armLength"] = arrSize[3];
    returnValue["legLength"] = arrSize[4];

    return returnValue;
  };

  dataSymmetrization = (returnVertex) => {
    // console.warn(returnVertex);
    // console.warn(this.mSymmetryIndex);
    // const bodyLength = 35739;
    const bodyLength = returnVertex.length;
    let newTempP;
    let newVertex = new Array(returnVertex.length);

    // for (let i = 0; i < returnVertex.length; i++) {
    for (let i = 0; i < bodyLength; i++) {
      newVertex[i] = returnVertex[i].clone();
    }

    for (let i = 0; i < bodyLength; i++) {
      // for (let i = 0; i < returnVertex.length; i++) {
      if (i == this.mSymmetryIndex[i]) {
        newVertex[i].x = 0.0;
      } else {
        const symmetry = returnVertex[this.mSymmetryIndex[i]];
        if (symmetry) {
          newTempP = returnVertex[this.mSymmetryIndex[i]].clone();
          newTempP.x *= -1.0;
          newVertex[i].add(newTempP);
          newVertex[i].divideScalar(2.0);
        } else {
          console.warn("symmetry index missing: " + i);
        }
      }
    }

    // for (let i = 0; i < returnVertex.length; i++)
    for (let i = 0; i < bodyLength; i++) returnVertex[i].copy(newVertex[i]);
  };

  dataNormalization = (returnVertex) => {
    const meanPosition = new THREE.Vector3(0, 0, 0);
    let yMin = 100000.0;

    for (let i = 0; i < returnVertex.length; i++) {
      meanPosition.add(returnVertex[i]);

      if (returnVertex[i].y < yMin) {
        yMin = returnVertex[i].y;
      }
    }

    meanPosition.divideScalar(returnVertex.length);
    meanPosition.y = yMin;

    for (let i = 0; i < returnVertex.length; i++)
      returnVertex[i].sub(meanPosition);
  };
}
