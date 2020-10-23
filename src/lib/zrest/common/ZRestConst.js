/* eslint-disable require-jsdoc */

// !!!! CLO에 있는 TextureType 그대로 가져왔으므로 CLO 변경되면 여기서도 변경해 줘야 함
const TEXTURE_TYPE = {
  GLOBAL_MAP: 0,
  DIFFUSE_MAP: 1,
  AMBIENT_MAP: 2,
  SPECULAR_MAP: 3,
  NORMAL_MAP: 4,
  DISPLACEMENT_MAP: 5,
  TRANSPARENTT_MAP: 6, // TRANSPARENT 가 win뭐시기에서 이미 정의되어서 이렇게 씀
  TRANSPARENT_MAP: 6,
  DIFFUSE_OVERLAY_MAP: 7,
  SPECULAR_OVERLAY_MAP: 8,
  REFLECTIVE_MAP: 9,
  EMISSION_MAP: 10,
  GLOSSINESS_MAP: 11, // PBR glossiness map,
  METALNESS_MAP: 12,
  // MAX_TEXTURE_TYPE // 항상 마지막에 위치시키기
};

const RENDER_FACE_TYPE = {
  MV_DOUBLE_FACE: 0,
  MV_FRONT_FACE: 1,
  MV_BACK_FACE: 2,
};

const MATMESH_TYPE = {
  PATTERN_MATMESH: 0,
  TRIM_MATMESH: 1,
  PRINTOVERLAY_MATMESH: 2,
  BUTTONHEAD_MATMESH: 3,
  NORMAL_MATMESH: 4,
  AVATAR_MATMESH: 5,
  STITCH_MATMESH: 6,
  BUTTONHOLE_MATMESH: 7,

  length: function () {
    return Object.values(this.MATMESH_TYPE).filter(
      (el) => typeof el === "number"
    ).length;
  },

  isAvatar: function (type) {
    return type === this.AVATAR_MATMESH;
  },

  isGarment: function (type) {
    return type !== this.AVATAR_MATMESH;
  },

  isSupplement: function (type) {
    return type !== this.AVATAR_MATMESH && type !== this.PATTERN_MATMESH;
  },
};

export { TEXTURE_TYPE, RENDER_FACE_TYPE, MATMESH_TYPE };
