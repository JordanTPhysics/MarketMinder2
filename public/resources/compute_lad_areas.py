import geopandas as gpd
from shapely.geometry import shape
import pandas as pd

# Load the file (GeoJSON or .json with GeoJSON structure)
gdf = gpd.read_file("Uk_AreaDistricts_GeoJson.json")

# Reproject to a suitable projected CRS for UK area calculations
gdf = gdf.to_crs(epsg=27700)  # British National Grid

# Calculate area in square km
gdf["area_km2"] = gdf.geometry.area / 1_000_000

# Calculate centroid (convert back to WGS84 lat/lon)
gdf_centroids = gdf.to_crs(epsg=4326)
gdf["centroid_lat"] = gdf_centroids.geometry.centroid.y
gdf["centroid_lon"] = gdf_centroids.geometry.centroid.x

# Extract correct LAD properties
gdf["district_name"] = gdf["LAD13NM"]
gdf["district_code"] = gdf["LAD13CD"]
gdf["district_type"] = "LAD"
gdf["country"] = gdf["LAD13CD"].str[0].map({
    "E": "England",
    "W": "Wales",
    "S": "Scotland",
    "N": "Northern Ireland"
})

# Select only what you want
out = gdf[[
    "district_code",
    "district_name",
    "district_type",
    "country",
    "area_km2",
    "centroid_lat",
    "centroid_lon"
]]

# Save CSV
out.to_csv("lad_areas.csv", index=False)
