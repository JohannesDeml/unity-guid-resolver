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
	/// Used for resolving GUIDs in the web with the extension Unity GUID Resolver
	/// </summary>
	public static class GuidMappingGenerator
	{
		public const int FileVersion = 1;

		[MenuItem("Assets/Generate Full GUID Mapping")]
		public static void GenerateGuidMappingMenuItem()
		{
			try
			{
				if (!GenerateGuidMapping("*"))
				{
					Debug.Log("Canceled GUID Mapping generation");
				}
			}
			finally
			{
				EditorUtility.ClearProgressBar();
			}
		}

		public static bool GenerateGuidMapping(string searchPattern)
		{
			Stopwatch sw = Stopwatch.StartNew();
			var mapping = new GuidMapping(Application.productName);
			if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping", "Collecting GUIDs", 0f))
			{
				return false;
			}

			var guids = AssetDatabase.FindAssets(searchPattern);
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
			string folderPath = Path.Combine(projectFolderPath, "Builds");
			// Make sure the folder exists
			Directory.CreateDirectory(folderPath);
			string filePath = Path.Combine(folderPath, $"guid-mapping.json");
			if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping", $"Serialize Json", 1f))
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