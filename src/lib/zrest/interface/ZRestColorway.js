import { makeMaterial } from "../builder/ZRestMaterial";
import { setTexturePropertyDisassembly } from "../builder/ZRestTexture";
import { MATMESH_TYPE } from "@/lib/zrest/common/ZRestConst";

export default class ZRestColorway {
  constructor({ zProperty: zProperty, matInfoMap: matInfoMap, clearFunc: clearFunc }) {
    this.zProperty = zProperty;
    this.matInfoMap = matInfoMap;
    this.clear = clearFunc; // NOTE: Consider whether this function is necessary.
  }

  changeColorway = async ({ colorwayIndex: colorwayIndex, jsZip: jsZip }) => {
    if (!this.checkColorwayIndex({ colorwayIndex: colorwayIndex, jsZip: jsZip })) {
      console.warn("colorwayIndex false");
      return false;
    }

    this.zProperty.colorwayIndex = colorwayIndex;

    if (this.zProperty.bSeparate) {
      await this.changeColorwayForSeparatedZRest();
    } else {
      await this.changeColorwayForUnifiedZRest({ jsZip: jsZip });
    }
    return true;
  };

  // NOTE: Consider outputting error codes
  checkColorwayIndex = ({ colorwayIndex: colorwayIndex, jsZip: jsZip }) => {
    if (colorwayIndex === undefined) {
      console.warn("Invalid colorwayIndex");
      return false;
    }

    const colorwaySize = this.zProperty.colorwaySize;
    if (colorwaySize - 1 < colorwayIndex || colorwaySize < 0) {
      console.warn("Invalid range of colorwayIndex");
      return false;
    }

    const isUnifiedZRest = !this.zProperty.bSeparate;
    const hasJSZip = jsZip !== undefined && jsZip !== null;
    if (isUnifiedZRest && !hasJSZip) {
      console.warn("jsZip missing");
      return false;
    }

    return true;
  };

  changeColorwayForUnifiedZRest = async ({ jsZip: jsZip }) => {
    this.clear(); // TODO: Not sure this function should be called

    const matMeshMap = this.zProperty.matMeshMap;
    for (const matMesh of matMeshMap.values()) {
      const prevMaterial = matMesh.material;
      if (!prevMaterial) continue;

      // NOTE: Avatar has not colorway
      const type = matMesh.userData.TYPE;
      if (MATMESH_TYPE.isAvatar(type)) continue;

      const bPrevUseSeamPuckeringMap = prevMaterial.uniforms.bUseSeamPuckeringNormal !== undefined ? prevMaterial.uniforms.bUseSeamPuckeringNormal.value : false;
      const id = matMesh.userData.MATMESH_ID;
      const matInfo = this.matInfoMap.get(id);
      const material = await makeMaterial({ jsZip: jsZip, matProperty: matInfo, zProperty: this.zProperty, bUseSeamPuckeringNormalMap: bPrevUseSeamPuckeringMap });
      matMesh.material = material;
    }
  };

  changeColorwayForSeparatedZRest = async () => {
    const materialInformationMap = this.matInfoMap;
    // console.warn(materialInformationMap);

    for (const entries of this.zProperty.matMeshMap.entries()) {
      const matMeshId = entries[0];
      const matMesh = entries[1];

      const matProperty = materialInformationMap.get(matMeshId);
      const bPrevUseSeamPuckeringMap = matMesh.material.uniforms.bUseSeamPuckeringNormal.value;
      const material = await makeMaterial({
        jsZip: null,
        matProperty: matProperty,
        zProperty: this.zProperty,
        matMeshID: matMeshId,
        bUseSeamPuckeringNormalMap: bPrevUseSeamPuckeringMap
      });
      matMesh.material = material;
    }

    this.zProperty.nameToTextureMap.forEach(async (threeJSTexture, textureFilename) => {
      await setTexturePropertyDisassembly({
        textureFilename: textureFilename,
        threeJSTexture: threeJSTexture,
        materialInformationMap: this.matInfoMap,
        zProperty: this.zProperty
      });
    });
  };
}
