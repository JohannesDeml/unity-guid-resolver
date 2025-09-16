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
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;
using Debug = UnityEngine.Debug;

namespace JD.GuidResolver.Editor
{
	/// <summary>
	/// Generate a mapping of all GUIDs in the project to their file meta data
	/// Used for resolving GUIDs in the web with the extension GUID Resolver for Unity
	/// </summary>
	public static class GuidMappingGenerator
	{
		public const int FileVersion = 2;
		private static string _identifier = Application.productName;
		private static string _searchPattern = "*";
		private static string _folderSubPath = "Builds";
		private static string _fileName = "guid-mapping.json";

		[MenuItem("Assets/Generate Full GUID Mapping")]
		public static void GenerateDefaultGuidMappingMenuItem()
		{
			SetDefaultExportValues();
			GenerateGuidMapping();
		}

		public static void GenerateDefaultGuidMappingMenuItem(string identifier)
		{
			SetDefaultExportValues();
			_identifier = identifier;
			GenerateGuidMapping();
		}

		public static void GenerateGuidMapping(string identifier, string searchPattern, string folderSubPath, string fileName)
		{
			SetDefaultExportValues();
			_identifier = identifier;
			_searchPattern = searchPattern;
			_folderSubPath = folderSubPath;
			_fileName = fileName;
			GenerateGuidMapping();
		}

		private static void SetDefaultExportValues()
		{
			_identifier = $"{Application.productName}-{Application.version}";
			_searchPattern = "*";
			_folderSubPath = "Builds";
			_fileName = "guid-mapping.json";
		}

		private static void GenerateGuidMapping()
		{
			try
			{
				if (!GenerateGuidMappingInternal())
				{
					Debug.Log("Canceled GUID Mapping generation");
				}
			}
			finally
			{
				EditorUtility.ClearProgressBar();
			}
		}

		private static bool GenerateGuidMappingInternal()
		{
			Stopwatch sw = Stopwatch.StartNew();
			var mapping = new GuidMapping()
			{
				identifier = _identifier,
				projectName = Application.productName,
				projectVersion = Application.version,
			};
			if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping", "Collecting GUIDs", 0f))
			{
				return false;
			}

			var guids = AssetDatabase.FindAssets(_searchPattern);
			for (var i = 0; i < guids.Length; i++)
			{
				if (i % 100 == 0)
				{
					if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping",
							$"Processing GUIDs {i}/{guids.Length}", (float)i / guids.Length))
					{
						return false;
					}
				}

				var guid = guids[i];
				var path = AssetDatabase.GUIDToAssetPath(guid);
				var fileName = path.Substring(path.LastIndexOf('/') + 1);
				mapping.mapping.Add(guid, new GuidMappingEntry()
				{
					fileName = fileName
				});
			}

			string projectFolderPath = Directory.GetParent(Application.dataPath).ToString();
			string folderPath = Path.Combine(projectFolderPath, _folderSubPath);
			// Make sure the folder exists
			Directory.CreateDirectory(folderPath);
			string filePath = Path.Combine(folderPath, _fileName);
			if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping", $"Serialize Json ({guids.Length} entries)", 1f))
			{
				return false;
			}

			using (StreamWriter file = File.CreateText(filePath))
			{
				JsonSerializer serializer = new JsonSerializer();
				serializer.Serialize(file, mapping);
			}

			Debug.Log($"Generated mapping for {guids.Length} assets in {sw.ElapsedMilliseconds}ms - saved to {filePath}");
			return true;
		}
	}
}