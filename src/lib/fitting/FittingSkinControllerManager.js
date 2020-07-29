import * as THREE from "@/lib/threejs/three";

export default class FittingSkinControllerManager {
  constructor() {
    this.mapSCMatMeshID = null;
    this.mapMatMesh = null;
  }

  init(zrest) {
    this.mapSCMatMeshID = zrest.meshFactory.matmeshManager.mapSCMatmeshID;
    this.mapMatMesh = zrest.zProperty.matMeshMap;

    // console.log(zrest);
    console.log(zrest.meshFactory.matmeshManager.mapSCMatmeshID);
    console.log(zrest.matMeshMap);
  }

  getVertexOnMatMeshByPartName = (partName) => {
    const combinedVertex = [];
    this.mapSCMatMeshID.get(partName).forEach((matMeshId) => {
      const matMesh = this.mapMatMesh.get(matMeshId);
      const vertex = matMesh.geometry.attributes.position.array;
      // const vertex = matMesh.userData.originalPos;

      // console.log("compare");
      // console.log(matMesh.geometry.attributes.position.array);
      // console.log(matMesh.userData.originalPos);

      // console.log("\t\t" + partName + " =+ " + vertex.length / 3);
      // const vertex = matMesh.userData.originalPos;
      combinedVertex.push(...vertex);
    });

    return combinedVertex;
  };

  getInvMatrixWorld = (partName) => {
    const matMeshId = this.mapSCMatMeshID.get(partName)[0];
    const matMesh = this.mapMatMesh.get(matMeshId);
    const matrixWorld = matMesh.matrixWorld;
    // console.log(matrixWorld);
    // const invMatrixWorld = new THREE.Matrix4().getInverse(matrixWorld);
    // console.log(invMatrixWorld);

    // return invMatrixWorld;
    return matrixWorld;
  };

  putVertexOnMatMeshByPartName = (partName, vertex) => {
    // prettier-ignore
    const initWorldMatrix = new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    // console.warn(initWorldMatrix);
    const combinedVertex = this.getVertexOnMatMeshByPartName(partName);
    if (vertex.length != combinedVertex.length) {
      console.warn("FAILED: " + partName);
      return;
    }
    // console.log(vertex);
    // console.log(combinedVertex);
    // console.log(this.mapSCMatMeshID.get(partName));

    let lastIndex = 0;
    const retListMatMesh = [];
    this.mapSCMatMeshID.get(partName).forEach((matMeshId) => {
      const matMesh = this.mapMatMesh.get(matMeshId);
      matMesh.matrixAutoUpdate = false;
      matMesh.matrixWorld.copy(initWorldMatrix);
      matMesh.matrixWorldNeedsUpdate = true;
      console.log(matMesh);
      retListMatMesh.push(matMesh);
      const vertexArr = matMesh.geometry.attributes.position.array;
      const vertexSize = vertexArr.length;

      const slicedVertexArr = new Float32Array(
        vertex.slice(lastIndex, lastIndex + vertexSize)
      );
      // TODO: Find better way
      for (let j = 0; j < vertexArr.length; ++j) {
        vertexArr[j] = slicedVertexArr[j];
      }
      lastIndex += vertexSize;
    });

    return retListMatMesh;
  };

  validate = (mapMatshapeRenderToSkinPos) => {
    for (const entries of mapMatshapeRenderToSkinPos.entries()) {
      const partName = entries[0];
      const uiVertexCount = entries[1].get("uiVertexCount");
      const zrestVertexCount =
        this.getVertexOnMatMeshByPartName(partName).length / 3;

      if (uiVertexCount !== zrestVertexCount) return false;
    }
    return true;
  };

  // getMesh(matMeshID) {}
}
