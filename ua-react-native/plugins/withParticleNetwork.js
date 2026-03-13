const {
  withXcodeProject,
  withInfoPlist,
  IOSConfig,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withParticleNetworkPlist(config) {
  return withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, "ios", config.modRequest.projectName);

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>PROJECT_UUID</key>
\t<string>${config.extra?.particleProjectId || "YOUR_PROJECT_ID"}</string>
\t<key>PROJECT_CLIENT_KEY</key>
\t<string>${config.extra?.particleClientKey || "YOUR_CLIENT_KEY"}</string>
\t<key>PROJECT_APP_UUID</key>
\t<string>${config.extra?.particleAppId || "YOUR_APP_ID"}</string>
</dict>
</plist>`;

    const plistPath = path.join(iosDir, "ParticleNetwork-Info.plist");

    if (!fs.existsSync(iosDir)) {
      fs.mkdirSync(iosDir, { recursive: true });
    }

    fs.writeFileSync(plistPath, plistContent);

    const project = config.modResults;
    const targetUuid = project.getFirstTarget().uuid;
    const groupKey = project.findPBXGroupKey({ name: config.modRequest.projectName });

    if (groupKey) {
      const existingFiles = project.pbxGroupByName(config.modRequest.projectName);
      const alreadyAdded = existingFiles?.children?.some(
        (child) => child.comment === "ParticleNetwork-Info.plist"
      );

      if (!alreadyAdded) {
        project.addFile("ParticleNetwork-Info.plist", groupKey, {
          target: targetUuid,
          lastKnownFileType: "text.plist.xml",
        });
      }
    }

    return config;
  });
}

function withParticleURLScheme(config) {
  return withInfoPlist(config, (config) => {
    const scheme = `pn${config.extra?.particleAppId || "YOUR_APP_ID"}`;

    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    const existingScheme = config.modResults.CFBundleURLTypes.find(
      (type) => type.CFBundleURLSchemes?.includes(scheme)
    );

    if (!existingScheme) {
      config.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: [scheme],
      });
    }

    return config;
  });
}

function withParticleNetwork(config) {
  config = withParticleNetworkPlist(config);
  config = withParticleURLScheme(config);
  return config;
}

module.exports = withParticleNetwork;
