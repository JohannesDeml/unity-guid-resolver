using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;

namespace UnityTools
{
    public static class GuidMappingGenerator
    {
        public const int FileVersion = 1;

        public static bool GenerateGuidMapping(string projectName,string projectPath)
        {
            GuidMapping mapping = new GuidMapping(projectName);
            Dictionary<string,string> guids = UnityDBTool.UseUnityDataBaseGuidToFileSample(projectPath + "/Library/SourceAssetDB");
            foreach (var item in guids)
            {
                var guid = item.Key;
                var path = item.Value;
                var fileName = path.Substring(path.LastIndexOf('/') + 1).Trim();
                mapping.mapping.Add(guid, new GuidMappingEntry()
                {
                    fileName = fileName
                });
                Console.WriteLine("AddGuid:"+guid+"\tPath:"+path);
            }
            var buildDirPath = projectPath + "/Builds/";
            if (!Directory.Exists(buildDirPath))
            {
                Directory.CreateDirectory(buildDirPath);
            }
            using (StreamWriter file = File.CreateText(buildDirPath + "guid-mapping.json"))
            {
                file.Write(JsonConvert.SerializeObject(mapping));
            }

            Console.WriteLine($"Generated mapping for {guids.Count} file");
            return true;
        }
    }
}
