// --------------------------------------------------------------------------------------------------------------------
// <copyright file="GuidMappingGenerator.cs">
//   Copyright (c) 2023 Johannes Deml. All rights reserved.
// </copyright>
// <author>
//   Johannes Deml
//   public@deml.io
// </author>
// --------------------------------------------------------------------------------------------------------------------

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace JD.GuidResolver.Editor
{
	[Serializable]
	public class GuidMapping
	{
		public string identifier;
		public string creationDate;
		public int fileVersion;
		public Dictionary<string, GuidMappingEntry> mapping;

		public GuidMapping()
		{
			identifier = Application.productName;
			creationDate = DateTime.Now.ToString("yyyy-MM-dd--HH.mm.ss");
			fileVersion = GuidMappingGenerator.FileVersion;
			mapping = new Dictionary<string, GuidMappingEntry>();
		}
	}

	[Serializable]
	public class GuidMappingEntry
	{
		public string fileName;
	}

	public static class GuidMappingGenerator
	{
		public const int FileVersion = 1;

		[MenuItem("Assets/Generate GUID Mapping")]
		public static void GenerateGuidMapping()
		{
			var mapping = new GuidMapping();
			var guids = AssetDatabase.FindAssets("*");
			foreach (string guid in guids)
			{
				var path = AssetDatabase.GUIDToAssetPath(guid);
				var fileName = path.Substring(path.LastIndexOf('/') + 1);
				mapping.mapping.Add(guid, new GuidMappingEntry()
				{
					fileName = fileName
				});
			}

			string projectFolderPath = Directory.GetParent(Application.dataPath).ToString();
			string folderPath = Path.Combine(projectFolderPath, "Builds", "GuidMapping");
			// Make sure the folder exists
			Directory.CreateDirectory(folderPath);
			string filePath = Path.Combine(folderPath, $"guid-mapping-{mapping.creationDate}.json");
			using (StreamWriter file = File.CreateText(filePath))
			{
				JsonSerializer serializer = new JsonSerializer();
				serializer.Serialize(file, mapping);
			}
			Debug.Log($"Generated mapping for {guids.Length} assets");
		}
	}
}