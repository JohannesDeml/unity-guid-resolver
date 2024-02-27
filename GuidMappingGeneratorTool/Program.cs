using LightningDB;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace UnityTools
{
    internal class Program
    {
        static void Main()
        {
            var fileRunPath=System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName;
            var projectRootPath = Directory.GetParent(fileRunPath);
            var prjectName = projectRootPath.Name;
            Console.WriteLine("RunPath:"+projectRootPath);

            bool AssetsDir = false;
            bool LibraryDir=false;
            bool ProjectSettingsDir = false;
            foreach (var item in projectRootPath.GetDirectories())
            {
                if (item.Name == "Assets")
                {
                    AssetsDir = true;
                }
                if (item.Name == "Library")
                {
                    LibraryDir = true;
                }
                if (item.Name == "ProjectSettings")
                {
                    ProjectSettingsDir = true;
                }
            }
            if (AssetsDir&&LibraryDir&&ProjectSettingsDir) {
                var SourceAssetDBPath = projectRootPath + "/Library/SourceAssetDB";
                GuidMappingGenerator.GenerateGuidMapping(prjectName, projectRootPath.FullName);
            }
            else
            {
                Console.WriteLine("Error:RunDirIsNotUnityProject");
            }
            Console.WriteLine("End.PressAnyKeyEnd");
            Console.ReadLine();
        }
        //static void XmlTest()
        //{
        //    string IUI = "--- !u!";
        //    // 替换为您的Unity序列化文件路径
        //    var filePath = "D:\\UnityProject\\VketSharedAssets\\Assets\\Scenes\\VRCDefaultWorldScene.unity";

        //    Dictionary<string, string> keyValuePairs = new Dictionary<string, string>();

        //    // 读取文件内容
        //    var line = File.ReadLines(filePath).ToList();
        //    string currentUID = string.Empty;
        //    for (int i = 0; i < line.Count; i++)
        //    {
        //        var l = line[i];
        //        if (l.StartsWith("%"))
        //        {
        //            //%YAML 1.1
        //            //%TAG !u! tag:unity3d.com,2011:
        //            continue;
        //        }
        //        if (l.StartsWith(IUI))
        //        {
        //            currentUID = l;
        //            keyValuePairs.Add(l, string.Empty);
        //            continue;
        //        }
        //        keyValuePairs[currentUID] = keyValuePairs[currentUID] + l + "\n";
        //    }
        //    foreach (var item in keyValuePairs)
        //    {
        //        Console.WriteLine(item.Key + "");

        //        StringReader strLoader = new StringReader(item.Value);
        //        YamlStream yaml = new YamlStream();
        //        yaml.Load(strLoader);
        //        strLoader.Dispose();

        //        // 获取文档的根节点
        //        YamlMappingNode rootNode = (YamlMappingNode)yaml.Documents[0].RootNode;
        //        // 输出节点数据
        //        foreach (var entry in rootNode.Children)
        //        {
        //            Console.WriteLine($"{entry.Key}:");
        //            var children = ((YamlMappingNode)entry.Value).Children;
        //            for (int j = 0; j < children.Count; j++)
        //            {
        //                if (children[j].Key.ToString() == "m_ObjectHideFlags")
        //                {
        //                    ((YamlMappingNode)entry.Value).Children[children[j].Key] = new YamlScalarNode("1111");
        //                }
        //                /// Console.WriteLine(children[j].Key + ":" + children[j].Value);
        //            }
        //        }
        //        //保存
        //        var writer = new StringWriter();
        //        writer.Flush();
        //        yaml.Save(writer, false);
        //        Console.WriteLine(writer.GetStringBuilder().ToString().TrimEnd('\r', '\n', ' ', '.'));
        //        writer.Close();
        //        writer.Dispose();
        //    }

        //}
    }
}